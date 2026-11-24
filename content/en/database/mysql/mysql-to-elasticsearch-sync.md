---
title: Detailed Guide to Syncing MySQL Data to Elasticsearch: Common Solutions and Consistency Handling
description: A detailed explanation of MySQL-to-Elasticsearch data synchronization solutions, comparing application-layer dual write, scheduled synchronization, Canal, Debezium, and Flink CDC, and covering full synchronization, incremental synchronization, out-of-order messages, idempotency, deletions, index rebuilding, and data reconciliation.
category: Databases
tag:
  - MySQL
  - Elasticsearch
  - Data Synchronization
head:
  - - meta
    - name: keywords
      content: MySQL to Elasticsearch Sync,MySQL Sync ES,MySQL ES Sync,Canal Sync ES,Flink CDC Sync ES,Debezium,CDC,binlog,Full Sync,Incremental Sync,Data Consistency
lang: en
sourceRef: zh-ref/database/mysql/mysql-to-elasticsearch-sync.md
---

MySQL excels at transaction processing, whereas Elasticsearch excels at full-text search and complex querying. Many systems use MySQL as the authoritative data source and organize the fields needed for search into documents written to Elasticsearch.

Once you do this, the tricky parts tend to concentrate in the following areas:

- During the initial launch, how do you import existing historical data from MySQL?
- When subsequent inserts, updates, and deletes occur in MySQL, how do you continuously keep ES up to date?
- When a sync job experiences duplicate consumption, out-of-order delivery, or interruptions, how do you prevent stale data from overwriting newer data?
- When the index schema changes or data becomes inconsistent, how do you rebuild the index and switch over smoothly?

A viable synchronization solution typically has to address **full synchronization, incremental synchronization, failure recovery, and data validation** together. Solving only one piece makes it easy to get stuck during launch or incident recovery.

## Clarify Synchronization Goals First

MySQL-to-Elasticsearch synchronization is usually divided into two categories:

- **Full Synchronization**: Reads existing data in MySQL to build a complete ES index. Commonly used for initial launch, index rebuilding, and data repair.
- **Incremental Synchronization**: Continuously captures committed `INSERT`, `UPDATE`, and `DELETE` operations in MySQL and updates the corresponding ES documents.

The two are frequently combined. For example, you first perform a full import of 10 million historical records, and then resume consuming incremental changes from the binlog position recorded when the full-sync job started until catching up with the latest data.

Also note that a successful write to ES does not mean the data is immediately searchable. Elasticsearch relies on `refresh` to make newly written documents visible to search, so end-to-end latency includes at least change capture, message queuing, data processing, ES writes, and `refresh`. Elastic officially refers to this search visibility model as [Near Real-Time Search](https://www.elastic.co/docs/manage-data/data-store/near-real-time-search).

![Bridging Full and Incremental Sync from MySQL to ES](/media/jg/ext/oss.javaguide.cn/javaguide/database/es/mysql-es-full-incremental-sync-e5d667d7.webp)

## Define the Synchronization Contract Before Selecting a Solution

Under different data models and consistency requirements, the exact same sync tool can yield completely different results. Before choosing a tool, write down the following agreements clearly:

- **Authoritative Data Source**: MySQL is typically the source of truth, while ES holds only a rebuildable search view. Business logic must not bypass MySQL to directly modify authoritative fields in ES.
- **Document Generation Rules**: Specify which tables and fields compose an ES document, where the document `_id` comes from, and which documents must be rebuilt when changes happen across multiple tables.
- **Deletion Semantics**: Clarify whether physical deletions, logical deletions, and business invalidations correspond to an ES `delete`, keeping a deletion flag, or regenerating the document.
- **Ordering and Versioning**: Define the partition key and version source for each document to prevent retries, concurrency, or multiple pipelines from allowing stale values to overwrite newer ones.
- **Latency and Recovery Objectives**: Agree on acceptable normal-case latency, how fast the pipeline must catch up after an outage, and how to re-initialize if downtime exceeds binlog or MQ retention.
- **Field Types and Empty/Null Values**: Specify how monetary amounts, unsigned integers, datetimes, enums, and empty strings are written to ES, distinguishing missing fields, `null`, and empty values.
- **Source Database Resource Budget**: Evaluate connection counts, concurrency, and disk I/O for full scans; decide whether to read from the primary or a read-only replica; and set rate limits and pause conditions for sync jobs.
- **Schema Change Process**: Define who updates mappings when fields are added, types are modified, or analyzers are adjusted, as well as the deployment order for the application, sync jobs, and index templates.

Acceptance testing must also go beyond checking that "total full-sync counts match." At a minimum, it needs to cover inserts, updates, physical deletes, logical deletes, duplicate messages, and out-of-order messages; you should also deliberately pause ES or the sync job and verify that it catches up upon recovery. A full dry run of backfilling a new index, catching up on incremental changes, running data validation, switching aliases, and rolling back should also be exercised end to end. Every item in the synchronization contract should map to a test case or a monitoring metric.

## Comparison of Common Solutions

| Solution                    | Full Sync        | Incremental Sync           | Main Advantages                                                | Main Issues                                                                 | Use Cases                                                                    |
| --------------------------- | ---------------- | -------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Application-Layer Dual Write| Not supported    | Supported                  | Intuitive to implement, short pipeline                         | Cannot commit atomically, intrusive to business code, prone to out-of-order | Simple workloads with small data volume that tolerate brief inconsistency     |
| Transactional Outbox + MQ   | Not supported    | Supported                  | Business updates and event persistence share one transaction   | Still requires separate full import, relay, and consumer components         | Applications already using an event-driven architecture                      |
| Scheduled Synchronization   | Supported        | Supported via conditional scan | Simple, low operations overhead                            | Higher latency; deletions and scan windows require extra handling           | Small data volume, low update frequency                                      |
| Canal + Consumer            | Handled separately | Supported                | Mature ecosystem, easy integration with MQ and custom consumers | Requires maintaining binlog positions, consumers, and full-sync handoff    | Incremental sync where Java/MQ infrastructure already exists                 |
| Debezium + Kafka            | Snapshot supported | Supported                | Mature Kafka Connect ecosystem, unified event format           | More moving parts, depends on Kafka Connect                                 | Existing Kafka Connect setup or multi-datasource CDC platform                |
| Flink CDC                   | Supported        | Supported                  | Seamless full-to-incremental handoff, ideal for complex transforms | Higher deployment and state management cost                             | Large data volume requiring stream processing or multi-table transformations |

"Supported" in the table only indicates that the tool provides that capability—it does not mean integrating it automatically satisfies business consistency requirements. The final outcome also depends on ES write patterns, message ordering, Checkpoints, retry policies, and index design.

## Application-Layer Dual Write

Application-layer dual write updates the Elasticsearch index via the Elasticsearch API right after business code updates MySQL.

![Application-Layer Synchronous Dual Write](/media/jg/ext/oss.javaguide.cn/javaguide/database/es/es-mq-synchronization-synchronous-double-write-c84c2d56.png)

Assuming the write order is "MySQL first, then ES," common outcomes are as follows:

| Scenario                                | MySQL       | Elasticsearch | Result                                |
| --------------------------------------- | ----------- | ------------- | ------------------------------------- |
| Both writes succeed                     | Succeeded   | Succeeded     | Data consistent                       |
| MySQL write fails                       | Rolled back | Not executed  | Data consistent                       |
| App crashes after MySQL succeeds        | Succeeded   | Not executed  | Data inconsistent                     |
| MySQL succeeds, ES write fails          | Succeeded   | Failed        | Data inconsistent                     |
| ES wrote successfully but client timed out | Succeeded | Outcome unknown | Retries must ensure idempotency     |

A MySQL transaction cannot roll back a write already committed to Elasticsearch, nor can Elasticsearch join a standard local transaction with MySQL. Therefore, synchronous dual write can generally only aim for eventual consistency.

Direct dual writes also have two easily overlooked issues.

The first is performance and availability. Business requests have to wait for an extra ES call, and ES jitter directly degrades the critical path. Switching to a thread pool, `CompletableFuture`, or asynchronous MQ publishing reduces request latency, yet the window where "MySQL has committed but the process crashes before sending the message" still remains.

The second is concurrent out-of-order writes. Suppose the same product record is updated sequentially to `v2` and `v3`; the two ES requests may arrive in reverse order, causing the older `v2` to overwrite `v3`. Merely making writes asynchronous does not automatically solve ordering issues.

### Filling the Transaction Gap with a Transactional Outbox

When higher synchronization reliability is required, you can use the **Transactional Outbox** pattern:

1. Within the same MySQL transaction, update the business table and insert an outbox event row.
2. An independent relay service or CDC component reads the outbox table and publishes the event to MQ.
3. The ES consumer processes the message, records the result upon success, and retries or sends to a Dead Letter Queue (DLQ) upon failure.

This guarantees that "updating business data" and "persisting the pending event" either both succeed or both roll back. Debezium also provides a dedicated [Outbox Event Router](https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html) to capture and transform outbox events.

While a transactional outbox solves event loss, you still need to handle duplicate consumption, per-primary-key message ordering, initial full load, and data reconciliation.

## Scheduled Synchronization

If data volume is small, update frequency is low, and the business can tolerate minute-level or even day-level latency, scheduled jobs are often sufficient. Personal blogs, internal knowledge bases, and small admin search portals are typical examples.

![Scheduled Synchronization](/media/jg/ext/oss.javaguide.cn/javaguide/database/es/es-mq-synchronization-scheduled-task-6b8f007f.png)

Scheduled synchronization does not have to run a full scan every time; it can query incremental changes by update timestamp:

```sql
SELECT id, title, content, updated_at
FROM article
WHERE (
        updated_at > :last_updated_at
        OR (updated_at = :last_updated_at AND id > :last_id)
      )
  AND updated_at <= :task_cutoff
ORDER BY updated_at, id
LIMIT :batch_size;
```

Fix `task_cutoff` at the start of the job, and save a composite cursor made of `last_updated_at` and `last_id` after each batch finishes. Subsequent batches keep using the same cutoff time until all records in that round are processed. This avoids deep pagination and prevents missing rows when multiple records share the same `updated_at`.

Physical deletions do not leave behind an `updated_at` timestamp, so scheduled incremental sync usually needs to be paired with a soft-delete column, a deletion log table, or periodic full reconciliation. Otherwise, records deleted from MySQL can linger in ES indefinitely.

Using Spring Task, a job that runs every Monday at midnight can be written like this:

```java
@Scheduled(cron = "0 0 0 ? * MON", zone = "Asia/Shanghai")
public void rebuildArticleIndex() {
    // Read MySQL in pages and bulk-write to the new ES index
}
```

### Use Index Aliases for Full Rebuilds

Do not delete and rewrite records directly in an old index while users are actively querying it. A safer approach is:

1. Create a new versioned index, such as `articles_v2`, with `settings` and `mappings` configured ahead of time.
2. Write the full MySQL dataset into the new index and verify document counts, sampled content, and query results.
3. Catch up on incremental changes generated while the full rebuild was running.
4. Use the `_aliases` API to atomically switch the business alias from the old index to the new index.
5. Keep the old index for a while and clean it up only after confirming everything looks good.

```http
POST /_aliases
{
  "actions": [
    { "remove": { "index": "articles_v1", "alias": "articles", "must_exist": true } },
    { "add": { "index": "articles_v2", "alias": "articles" } }
  ]
}
```

Elasticsearch's [Aliases API](https://www.elastic.co/guide/en/elasticsearch/reference/current/aliases.html) can perform multiple alias operations in a single atomic request. However, alias switching only handles smooth cutover of read traffic; if business writes continue during the rebuild, you must still reconcile those changes via binlog replay, dual-index writes, or temporarily pausing writes.

## Binlog-Based CDC

CDC (Change Data Capture) solutions read the MySQL binlog and convert committed data changes into events consumable downstream. This avoids maintaining ES write logic in every business endpoint and is currently the more common approach for incremental synchronization.

Verify the following settings before onboarding:

- MySQL has binlog enabled, and the CDC account has the required replication and table read permissions.
- Use a binlog format supported by the tool. Row-level change capture tools like Canal, Debezium, and Flink CDC generally require `binlog_format=ROW`; Debezium explicitly requires `binlog_row_image=FULL` as well, and you should verify this setting for other tools according to the exact version in use. MySQL 8.4 defaults `binlog_format` to `ROW`, while legacy environments and managed cloud databases should always be checked against actual settings.
- Binlog retention covers the longest expected outage recovery window. If a job stops for too long and required binlog files have already been purged, you usually have no choice but to re-run a snapshot or full sync.
- Each CDC client uses a unique `server_id`; during high-availability failovers, also verify GTID, position recovery, and the binlog settings of the connected replica.
- Grant the CDC account only the replication, metadata, and target-table read privileges required by the tool's documentation, and restrict the ES account to writes on target indices or aliases; never store credentials directly in job configurations committed to the code repository.

### Canal

[Canal](https://github.com/alibaba/canal) emulates the MySQL Replica protocol, requesting binlogs from MySQL and parsing them into structured change events.

![How Canal Works](/media/jg/ext/oss.javaguide.cn/github/javaguide/open-source-project/canal-overview-80f4ee19.png)

Canal Server's core responsibility is subscribing to and parsing incremental logs. Downstream services can consume directly via Canal Client, or have Canal publish messages to an MQ such as Kafka or RocketMQ so a sync service can update ES.

![Canal Syncing Data via MQ](/media/jg/ext/oss.javaguide.cn/javaguide/database/es/es-mq-synchronization-canal-with-mq-fae56985.png)

Introducing an MQ provides several benefits:

- Decouples Canal from ES consumers, allowing changes to buffer in MQ during brief ES outages.
- Routes events with the same business primary key to the same partition, making it easier to preserve per-key ordering.
- Allows consumers to batch messages and call the ES Bulk API, reducing request overhead.
- With message retention enabled, failed records can be replayed or downstream indices rebuilt.

An MQ does not automatically guarantee consistency. Consumers still need to decide when offsets are committed, how failures are retried, whether retries are idempotent, and who repairs dead-letter data.

Canal Server focuses on incremental subscription. Initial full data can be imported via a custom paginated job or a compatibility-verified batch sync tool. Although [DataX Open Source](https://github.com/alibaba/DataX/tree/master/elasticsearchwriter) provides `ElasticsearchWriter`, its official README still notes that it was only tested against Elasticsearch 5.x—before connecting to ES 7/8, you must verify mapping types, client protocols, and write parameters. Canal Client Adapter also provides ETL capabilities for some downstream targets, which similarly must be validated against your actual ES version and complex mappings. When full and incremental loads are handled by two separate jobs, the most critical step is recording and handing off the exact binlog position.

### Flink CDC

Flink CDC's MySQL Source can read a table snapshot first and then seamlessly continue consuming the binlog. It splits a table into multiple Chunks by shard key to read the snapshot in parallel; before and after reading each Chunk, it records the `LOW` and `HIGH` binlog positions and merges changes occurring during that window to obtain a consistent Chunk result.

This incremental snapshot algorithm has several key traits:

- The snapshot phase can read in parallel.
- Checkpoints are taken at Chunk granularity, allowing recovery from completed progress after a failure.
- It avoids holding a global read lock acquired via `FLUSH TABLES WITH READ LOCK` for the entire snapshot phase.
- Once the full snapshot finishes, it automatically continues reading the binlog, reducing manual binlog-position handoff work.

![Flink CDC Incremental Snapshot Bridging to Binlog](/media/jg/ext/oss.javaguide.cn/javaguide/database/es/flink-cdc-incremental-snapshot-68392a53.webp)

As of Flink CDC 3.6, the project officially provides the [MySQL Pipeline Connector](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.6/docs/connectors/pipeline-connectors/mysql/) and [Elasticsearch Pipeline Connector](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.6/docs/connectors/pipeline-connectors/elasticsearch/), allowing you to define a MySQL-to-ES pipeline directly. The ES Sink does not auto-create indices, so you still need to prepare indices, mappings, and relevant templates beforehand.

The `exactly-once` guarantee described in Flink CDC documentation primarily covers Source processing semantics during snapshot and binlog reading. Flink's official Elasticsearch Sink documentation states a baseline delivery guarantee of `at-least-once`: checkpoints wait for in-flight ES requests to complete, but requests may still be replayed during failure recovery. Using a fixed document ID and idempotent `index`/`upsert` operations ensures duplicate writes land on the same document; if events for the same document can also arrive out of order, you must additionally pair this with a source version number. Source `exactly-once` does not automatically imply end-to-end `exactly-once` from MySQL to ES.

### Debezium

Debezium's MySQL Connector typically runs on Kafka Connect. On initial startup, it can execute a consistent snapshot and then continuously emit row-level change events to Kafka Topics starting from the snapshot's binlog position. Chunked incremental snapshots can also be triggered later on demand.

If your team already uses Kafka Connect, or plans to standardize change streams from multiple databases into Kafka, Debezium saves effort compared to building custom binlog parsing and event schemas. Writing to ES still requires an Elasticsearch Sink Connector or a custom consumer, and delete events, Topic compaction, schema evolution, and message transformation rules must all be designed separately.

Refer to the [Debezium MySQL Connector Official Documentation](https://debezium.io/documentation/reference/stable/connectors/mysql.html) for detailed snapshot flows and configuration options.

## Issues You Must Handle in Production

Tool selection only decides how changes reach downstream. Whether the data stays accurate depends on the following implementation details.

![Consistency Guardrails for MySQL-to-ES Sync](/media/jg/ext/oss.javaguide.cn/javaguide/database/es/mysql-es-consistency-guardrails-10110577.webp)

### 1. Use the MySQL Primary Key as the ES Document ID

During synchronization, use a stable, unique business primary key as the ES `_id`. Repeating an `index` or `upsert` for the same record updates the same document, making consumer idempotency much easier to achieve.

If you let ES auto-generate `_id`, message retries can create duplicate documents, and deletions become hard to target accurately.

### 2. Guarantee Event Ordering for the Same Document

Global ordering is usually expensive, and MySQL-to-ES sync typically only needs ordering per document ID. A common practice is partitioning MQ messages by business primary key so events for the same key land in the same partition and are processed sequentially.

Even then, consumer rebalancing, failure retries, and multiple sync paths can still cause out-of-order delivery. For scenarios that cannot tolerate stale values overwriting newer ones, attach a monotonically increasing business version number to both events and ES documents, and discard older versions before writing. Version numbers must come from a reliable sequential source—never use local wall-clock timestamps generated independently across multiple machines.

If the source version can be represented as a non-negative `long`, the `index` and `delete` operations in the [ES Bulk API](https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-bulk) support `version` and `version_type=external`: only writes with a strictly higher version can overwrite an existing document. Delete events must also carry the same version sequence; otherwise, a delayed stale update could resurrect a deleted document. GTIDs, binlog filenames, and positions usually cannot be used directly as ES external versions without conversion—define a stable comparison rule before implementing.

### 3. Handle Deletions Properly

`INSERT` and `UPDATE` can ultimately be unified into `upsert`, whereas `DELETE` must be explicitly translated into an ES `delete` operation. If the business uses soft deletes, agree uniformly on whether to delete the ES document or retain it with `deleted=true`.

If the sync job filters records by mutable fields such as `status` or `is_deleted`, you also need to handle the case where "a record previously matched the filter, and after an update it no longer matches." A naive filter merely drops the new update event without generating a `delete` for the existing document in ES. You can either keep the status field and filter at query time, or detect state transitions and explicitly emit a delete event.

Multi-table aggregated documents are especially prone to missed deletions. For example, if a product document combines fields from product, brand, and category tables, deleting a category does not mean simply deleting an "ES document matching the category ID"—you must locate the affected products and rebuild their documents.

### 4. Handle Multi-Table Documents

Binlogs record row-level changes in individual tables, whereas ES typically uses denormalized documents. A single product document might combine data from product, brand, inventory, and tag tables.

When CDC captures a brand name change, you need to know which products reference that brand. There are three common ways to handle this:

- Have the consumer query MySQL based on the change event and reassemble the full affected documents.
- Maintain a search-friendly wide table in MySQL first, and then sync the wide table.
- Use a stream processing engine such as Flink to maintain join state and emit downstream documents.

The first approach is easy to implement, but requires controlling MySQL lookup concurrency and caching; the second increases wide-table maintenance overhead; the third suits high-volume scenarios with complex join logic, though state, Checkpoints, and job upgrades require dedicated operations support.

### 5. Inspect Individual Item Results Even in Bulk Writes

The Elasticsearch [Bulk API](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html) executes multiple `index`, `update`, and `delete` operations in one request, reducing network and request-handling overhead.

Within a single Bulk request, only a subset of documents may fail. Consumers must not check only the HTTP status code—they must inspect every entry in `items` and retry only transient errors such as network timeouts, `429`, and certain `5xx` responses. Retrying deterministic issues like mapping conflicts or invalid field formats is usually pointless; log the raw message and route it to a Dead Letter Queue or manual remediation workflow.

There is no fixed Bulk batch size that works for every system. Batch count, byte size, concurrency, and refresh interval must be tuned based on document size, shard count, ES write queues, and load-test results.

When ES write throughput falls behind upstream change rates, propagate backpressure upstream: cap in-flight Bulk requests and consumer concurrency, and pause consumption or throttle Source reads when necessary. Do not use unbounded in-memory queues to absorb backlogs—that only turns an ES write bottleneck into an Out of Memory (OOM) crash in the sync process. When using an MQ, ensure message retention covers the longest expected backlog duration.

### 6. Manage Mappings and DDL Changes

Adding a column in MySQL does not mean ES mappings should automatically add a field of the same name. Dynamic mapping can misclassify dates, numbers, or strings, or cause a mapping explosion as field counts grow unchecked.

Field mappings should be designed around query patterns rather than mechanically converted from MySQL column types:

- Use `text` for names, titles, and descriptions requiring full-text search; add a `keyword` sub-field if sorting, aggregations, or exact filtering are also needed. Structured strings such as status codes, tags, and email addresses generally use `keyword` directly.
- Never blindly convert monetary amounts to `float` or `double`. Store integer values in the smallest currency unit, or use `scaled_float` according to allowed precision—either way, fix the conversion rule in the synchronization contract.
- The upper bound of MySQL `BIGINT UNSIGNED` exceeds ES `long`; large values should use `unsigned_long` or be converted to `keyword` rather than silently overflowing during serialization.
- MySQL `TIMESTAMP` converts between the session time zone and UTC, whereas `DATETIME` does not perform the same automatic conversion. The sync pipeline should fix the source session time zone and ES date format, and verify behavior with samples across time zones and near Daylight Saving Time (DST) transitions.
- Distinguish missing fields, `null`, empty strings, and empty arrays. Decide consistently before writing whether they participate in `exists` queries, sorting, aggregations, and partial updates.

Production environments are better served by explicit mappings and index templates. When incompatible changes occur to field types or analyzers, create a new index, perform a full rebuild, and switch over via aliases. CDC jobs also need clear rules on how to handle MySQL DDL events and the release ordering across application code, index templates, and sync jobs.

### 7. Monitor Latency, Failures, and Binlog Retention

At a minimum, track the following metrics:

- Lag between the current consumer position and MySQL's latest binlog position.
- MQ backlog volume and oldest message age.
- ES Bulk success rate, per-item failure reasons, retry counts, and dead-letter volume.
- Full-sync read rate, write rate, and remaining data volume.
- Whether remaining binlog retention exceeds the current backlog plus incident recovery time.
- ES cluster health, write rejections, disk watermarks, and `refresh` latency.

Alert thresholds should be set according to business latency SLOs and load-test baselines. Hardcoding universal thresholds like "lag > 60 seconds" or "failure rate > 1%" across all systems usually lacks empirical grounding.

### 8. Reconcile Periodically and Retain Rebuild Capability

Zero MQ lag does not guarantee data consistency. Bugs in sync rules, missed deletions, mapping conflicts, and manual edits to ES can all introduce silent drift.

Reconciliation can be layered:

1. Compare active record counts between MySQL and ES to quickly spot obvious discrepancies.
2. Compute counts and summaries by primary-key range or business partition to narrow down problem areas.
3. Sample and compare key fields, or compute hashes over normalized documents.
4. Feed divergent primary keys into a repair job to regenerate the corresponding documents rather than manually patching ES.

No matter how reliable the daily incremental pipeline is, you should retain the capability to "one-click create a new index, backfill full data, catch up on incrementals, validate, and switch aliases." It serves both data repair and mapping/analyzer upgrades.

### 9. Prepare Runbooks for Incident Recovery

Deciding on the fly whether to "retry or rebuild" after an alert fires easily escalates an incident. Before launch, document recovery procedures for common failures and run drills to verify that binlog positions, Checkpoints, MQ offsets, and index aliases behave as expected.

| Failure Scenario                                | Handling Approach                                                                                    | What Not to Do Directly                                         |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| ES temporarily unavailable or returns 429/5xx   | Pause or rate-limit writes, keep unacknowledged messages, retry with backoff, monitor backlog drop  | Commit consumer offsets before writes succeed                   |
| Mapping conflict or field format error          | Stop futile retries, log raw event and error reason, fix template/transform logic, replay selectively| Retry deterministic errors infinitely                           |
| CDC job restarts and state is still valid       | Recover from saved Checkpoint, binlog position, or MQ offset and rely on idempotent writes to dedup  | Wipe state and start directly from the latest position          |
| Required binlog or MQ messages have expired     | Re-run a consistent snapshot or full rebuild, and re-establish the full-to-incremental handoff       | Skip to the latest position and claim data is consistent        |
| ES index corrupted or mapping rules overhauled  | Create a new index, backfill full data, catch up incrementals, validate, then switch alias           | Delete and patch in place on the old index without a rollback point |

Runbooks should also document owners, required permissions, locations of state files or Checkpoints, dead-letter replay entry points, and rollback criteria. After each drill, check whether recovery triggered source DB load spikes, ES write rejections, repeated binlog expiration, or endless replay of the same batch.

## How to Choose?

- Small data volume, infrequent updates, higher latency tolerated: Prefer scheduled incremental sync paired with periodic full rebuilds.
- Reliable domain events and MQ already in place: Use Transactional Outbox + MQ, with a sync service consuming events to update ES.
- Primary need is reliably capturing MySQL incremental changes, and the team knows Java and MQ well: Canal + MQ + custom consumers is usually a solid fit, with full sync designed separately.
- Existing Kafka Connect platform or need to ingest multiple databases uniformly: Consider Debezium.
- Large data volume, automatic full-to-incremental handoff desired, or stream cleansing / multi-table transforms required: Consider Flink CDC.

Do not base final selection solely on tool throughput. Establish your acceptable search latency, outage recovery time, number of deployable components, multi-table document complexity, and team operational capacity first—then run load tests with near-production data volume and document structures.

## References

- [MySQL 8.4: Setting the Binary Log Format](https://dev.mysql.com/doc/refman/8.4/en/binary-log-setting.html)
- [Canal Project Documentation](https://github.com/alibaba/canal)
- [Flink CDC 3.6: MySQL Pipeline Connector](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.6/docs/connectors/pipeline-connectors/mysql/)
- [Flink CDC 3.6: Elasticsearch Pipeline Connector](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.6/docs/connectors/pipeline-connectors/elasticsearch/)
- [Flink: Fault Tolerance Semantics of the Elasticsearch Sink](https://nightlies.apache.org/flink/flink-docs-stable/docs/connectors/datastream/elasticsearch/)
- [Debezium MySQL Connector](https://debezium.io/documentation/reference/stable/connectors/mysql.html)
- [Debezium Outbox Event Router](https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html)
- [Elasticsearch Bulk API](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-bulk.html)
- [Elasticsearch Aliases](https://www.elastic.co/guide/en/elasticsearch/reference/current/aliases.html)
- [Elasticsearch Field Data Types](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/field-data-types)
- [Elasticsearch Numeric Field Types](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/number)
- [MySQL 8.4: The DATE, DATETIME, and TIMESTAMP Types](https://dev.mysql.com/doc/refman/8.4/en/datetime.html)
- [Spring Framework: Task Execution and Scheduling](https://docs.spring.io/spring-framework/reference/integration/scheduling.html)
