---
title: "Distributed Configuration Center Explained: Apollo vs. Nacos vs. Spring Cloud Config vs. K8s ConfigMap"
description: "In-depth guide to distributed configuration center principles and technology selection, covering architectural differences among Apollo, Nacos, Spring Cloud Config, and Kubernetes ConfigMap, configuration push mechanisms, canary releases, high-availability design, and common interview questions."
category: Distributed Systems
keywords:
  - Configuration Center
head:
  - - meta
    - name: keywords
      content: Configuration Center,Distributed Configuration Center,Apollo,Nacos,Spring Cloud Config,Kubernetes ConfigMap,Configuration Push,Long Polling,Canary Release,Configuration Center Interview Questions
lang: en
sourceRef: zh-ref/distributed-system/distributed-configuration-center.md
---

## Why Use a Configuration Center?

In a microservices architecture, an application is split into numerous independently deployed services, and each service maintains its own configuration (service addresses, database parameters, feature flags, etc.). The number of configuration items grows alongside the number of services, environments, and clusters. Traditional configuration files suffer from the following problems:

- **Restart Required on Change**: Whether configuration lives in the code repository or external files, many applications must restart their processes for new settings to take effect.
- **Coupled to Code Releases**: When configuration is kept inside the code repository, configuration changes are often tied to code deployments, making independent canary rollout and rollback difficult.
- **Insufficient Security**: Writing sensitive configuration (database passwords, API keys) directly into the code repository increases the risk of leaks.
- **Lack of Access Control**: There is no fine-grained permission control over viewing, editing, and publishing configuration.
- **Fragmented and Hard to Manage**: Configurations across multiple environments (dev/test/prod) and multiple clusters are scattered everywhere, making unified maintenance difficult.

In addition, configuration centers typically provide these enhanced capabilities:

- **Version Management**: Records who changed what and when for every configuration update, supporting one-click rollback.
- **Canary Release**: Pushes configuration changes to a subset of instances first for verification before full rollout, reducing change risk (supported by Apollo and Nacos 1.1.0+).

![Apollo Configuration Center](/media/jg/ext/oss.javaguide.cn/github/javaguide/config-center/view-release-history-08163626.png)

Of course, not every system needs a configuration center. For monolithic applications, single-environment setups, or cases with very few configuration items that rarely change, `application-{profile}.yml`, environment variables, or Kubernetes ConfigMaps plus rolling restarts are usually enough. A configuration center adds operational overhead, new failure domains, and extra troubleshooting paths, so small teams or low-frequency configuration scenarios should avoid over-engineering.

From a distributed systems perspective, a configuration center is a classic control plane: it decides "which configuration snapshot should currently be active," while clients handle pulling, caching, listening, and refreshing. Configuration publishing, canary rollout, rollback, and client-side local snapshots all address the trade-off between centralized decision-making and client-side disaster tolerance. You can read this alongside [Distributed Coordination Explained](./protocol/centralized-and-decentralized.md) to connect the concepts.

Configuration centers also frequently appear alongside [RPC](./rpc/) and [API Gateways](./api-gateway.md): RPC frameworks need governance configurations such as service addresses, timeouts, retries, and degradation rules, and gateways may rely on a configuration center for dynamic routing and canary rules. They solve different problems, yet in real-world microservices architectures they are usually wired into the same request pipeline.

## What Are the Common Configuration Centers? How Should You Choose?

| Solution                                                            | Status      | Highlights                                                           |
| ------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------- |
| [Spring Cloud Config](https://cloud.spring.io/spring-cloud-config/) | Active      | Native Spring ecosystem support; backed by Git storage               |
| [Nacos](https://github.com/alibaba/nacos)                           | Active      | Open-sourced by Alibaba; combines configuration center + service discovery |
| [Apollo](https://github.com/apolloconfig/apollo)                    | Active      | Open-sourced by Ctrip; strong configuration governance, permissions, and auditing |
| K8s ConfigMap                                                       | Active      | Kubernetes-native solution                                           |
| Disconf / Qconf                                                     | Inactive    | Not recommended for new projects                                     |

**Selection Recommendations**:

- Only need a configuration center → **Apollo** (finer-grained governance) or **Nacos** (lighter standalone startup)
- Need both configuration center + service discovery → **Nacos**
- Spring Cloud stack seeking simplicity → **Spring Cloud Config**
- Kubernetes environment → **K8s ConfigMap volume mount + application-level file watching**. When a ConfigMap is mounted as a Volume, `kubelet` syncs it periodically, and final visibility latency depends on the kubelet sync period and local cache propagation; environment variables and `subPath` mounts do not update automatically. Hot reload can use `inotify` to watch mounted files, or Spring Cloud Kubernetes to watch ConfigMap changes via the K8s Watch API and trigger refreshes.

**Apollo vs. Nacos vs. Spring Cloud Config**

> **Version Note**: The comparison below is based on Apollo 2.x, Nacos 2.x, and Spring Cloud Config 4.x/5.x. The Spring Boot 3 ecosystem typically maps to Spring Cloud Config 4.x, while Spring Boot 4 maps to the newer Spring Cloud 2025.x release train; if you are still on Spring Boot 2, the corresponding version is Spring Cloud Config 3.x.

| Feature                 | Apollo                                                        | Nacos                                                      | Spring Cloud Config                       |
| ----------------------- | ------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------- |
| Config UI               | Supported (comprehensive permissions, audit, release workflow) | Supported                                                  | None (typically managed via Git platform) |
| Real-Time Config Effect | Supported (HTTP long polling; typically second-level pickup)  | Supported (gRPC change notification + client pull)         | Near real-time (requires refresh or Bus broadcast) |
| Version Management      | Natively supported                                            | Natively supported                                         | Relies on Git                             |
| Access Control          | Supported (multi-level: app / namespace / environment, etc.)  | Supported                                                  | Relies on Git platform                    |
| Canary Release          | Supported (finer-grained rules)                               | Supported (1.1.0+, relatively basic capabilities)          | Not supported                             |
| Config Rollback         | Supported                                                     | Supported                                                  | Relies on Git                             |
| Alert Notifications     | Supported                                                     | Supported                                                  | Not supported                             |
| Multi-Language          | Supported (Open API / multi-language clients)                 | Supported (Open API / multi-language clients)              | Geared toward Spring applications         |
| Multi-Environment       | Supported (typically physically isolated)                     | Supported (mostly logical isolation via Namespace)         | Requires multiple Git repositories        |
| Dependent Components    | MySQL (service registry embedded in Config Service by default) | External MySQL (recommended for prod) / embedded Derby + JRaft | Git + optional message queue         |

**In-Depth Comparison**:

1. **Apollo**: Stronger in permission models, release auditing, pre-release diffs, and canary rules—well suited for teams with strict configuration governance requirements. In physically isolated multi-environment deployments (FAT/UAT/PROD), each environment requires its own Config Service, Admin Service, and dedicated database, making operational overhead medium to high.
2. **Nacos**: Combines configuration center and service registry in one, with simple deployment (standalone mode runs from a single JAR). Production clusters recommend an external MySQL database; embedded Derby + JRaft is better suited for testing or small-scale deployments. Nacos's `Namespace/Group/DataId` model is quick to pick up, though environment isolation is typically logical.
3. **Spring Cloud Config**: Simplest architecture (Git-backed), but poor real-time responsiveness and requires additional components for automatic refresh.

## Boundaries Between Configuration Centers, Service Registries, and K8s ConfigMap

- **Application Configuration Centers (Apollo / Nacos / Spring Cloud Config)**: Primarily solve centralized management, auditing, canary rollout, and dynamic refresh of application configs such as business parameters, feature switches, thresholds, and connection info.
- **Service Registries (Eureka / Nacos / Consul)**: Primarily handle service instance registration, discovery, and health status synchronization. Although Nacos provides both configuration center and service registry features, the two responsibilities remain distinct.
- **Kubernetes ConfigMap**: Primarily handles container runtime configuration such as Pod startup arguments, environment variables, and mounted files; it does not natively provide release approvals, canary rules, or in-app object refresh.
- **Service Mesh / Ingress Configuration**: Primarily handles traffic routing, circuit breaking, retries, timeouts, canary traffic, and other governance policies; configuration objects are typically CRDs or control-plane resources.

## Core Design Considerations for a Configuration Center

When designing or selecting a configuration center, pay close attention to the following capabilities:

### 1. Configuration Push Mechanisms

| Mode             | Real-Time Latency    | Server Load                                  | Implementation Complexity | Best-Fit Scenario            |
| ---------------- | -------------------- | -------------------------------------------- | ------------------------- | ---------------------------- |
| **Push Mode**    | High (millisecond)   | High (must maintain persistent connections)  | High                      | Strict real-time requirements |
| **Pull Mode**    | Low (seconds–minutes) | High (wasted polling requests)              | Low                       | Rarely changing configs      |
| **Long Polling** | Medium-High (seconds) | Medium (memory pressure at massive connection counts) | Medium           | **Mainstream solution**      |

> **Push Mechanism Notes**:
>
> - **Apollo**: Uses HTTP long polling. The client initiates a request; if changes exist, the server responds immediately; otherwise, the server holds the request open (server default is ~60s, while client read timeout is typically longer) and responds immediately if any change occurs during that window.
> - **Nacos 2.x**: Upgraded service discovery links to bidirectional gRPC streams for better real-time performance; the configuration center path is more accurately described as a two-phase "change notification + client pull" model, where the server notifies clients that a config changed and clients then pull the latest content on demand.
>
> **Note**: Strictly speaking, long polling is still a client-initiated pull request where the server achieves near-real-time delivery by suspending the response; this table lists it separately following industry convention to highlight its runtime behavior. Although long polling saves CPU and network overhead compared to short polling, at hundreds of thousands of clients the server still holds massive numbers of suspended requests. Taking Apollo as an example, the server suspends requests using Spring MVC `DeferredResult`, built atop Servlet 3.0 async support and the Tomcat NIO Connector, which still places demands on memory and connection limits.

### 2. Essential Feature Checklist

- **Access Control**: Tiered permissions for viewing, editing, and publishing configs
- **Audit Logs**: Complete history of who modified configuration, when, and what changed
- **Version Management**: Generate a version number on every release, supporting rollback to any historical version
- **Canary Release**: Push config to a subset of instances first, then roll out globally after verification
- **Multi-Environment Isolation**: Manage dev, test, and production configs independently
- **High-Availability Deployment**: Deploy the configuration center itself as a cluster to eliminate single points of failure

### 3. Client Disaster Tolerance and Startup Ordering

A configuration center is foundational infrastructure—if it goes down, large numbers of business applications are affected. Clients must therefore support fault tolerance:

- **Multi-Level Caching**: Read in-memory config first; if the configuration center is unavailable, fall back to the local snapshot; if no local snapshot exists either, use fallback defaults in code or refuse to start.
- **Degraded Startup**: For non-critical configurations, start up using the local snapshot first and reconnect to the configuration center asynchronously; for critical configurations like database URLs or encryption keys, you can choose "fail to start without configuration."
- **Reconnect with Backoff**: After a long-polling request or persistent connection drops, clients should reconnect using a backoff strategy to avoid overwhelming the configuration center with a thundering herd when it recovers.
- **Refresh Boundaries**: Dynamic refresh does not mean every object updates automatically. For example, values already injected into regular Spring fields, `final` fields, or conditional assembly logic may not refresh as expected—requiring `@RefreshScope`, change listeners, or rethinking bean lifecycles.

## Designing a Configuration Center: Apollo as a Case Study

### Introduction to Apollo

According to Apollo's official introduction:

> [Apollo](https://github.com/apolloconfig/apollo) is a distributed configuration center developed by Ctrip's framework department. It centrally manages configurations across different environments and clusters, pushes configuration changes to applications in real time, and provides standardized permission and workflow governance, making it well suited for microservices configuration management.
>
> The server side is built on Spring Boot and Spring Cloud, and can run directly after packaging without installing an external application container like Tomcat.
>
> The Java client has zero framework dependencies and runs in any Java runtime environment, while also offering strong integration with Spring and Spring Boot.

Core features of Apollo:

- **Real-Time Config Effect (Hot Publishing)**: Based on long polling; latest configurations are received within 1 second
- **Canary Release**: Push config only to selected application instances to reduce change risk
- **Simple Deployment**: A single environment depends only on MySQL; Apollo's built-in service registry (Eureka by default) runs embedded inside the Config Service process without requiring standalone deployment. For physically isolated multi-environment setups, each environment needs its own Config Service, Admin Service, and dedicated database
- **Cross-Language**: Exposes HTTP APIs, placing no restrictions on programming language

To learn how to use Apollo, see the [Official Apollo User Guide (in Chinese)](https://www.apolloconfig.com/#/zh/).

### Apollo Architecture Analysis

The basic Apollo model provided in the official documentation (Image source: Apollo Official Docs - Apollo Design):

![](/media/jg/ext/img-blog.csdnimg.cn/a75ccb863e4a401d947c87bb14af7dc3-de9ce86e.png)

1. The user modifies/publishes a configuration in the Apollo configuration center
2. The Apollo configuration center notifies the application that the configuration has changed
3. The application queries the Apollo configuration center to fetch the latest configuration

Official architecture diagram (Image source: Apollo Official Docs - Apollo Design):

![](/media/jg/ext/img-blog.csdnimg.cn/79c7445f9dbc45adb45699d40ef50f44-cab2dfa6.png)

### Component Descriptions

| Component             | Responsibility                                                                                       | Default Port              |
| --------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------- |
| **Portal**            | Web management UI providing visual configuration management                                          | 8070                      |
| **Client**            | Client SDK providing configuration retrieval and change-listening capabilities                       | -                         |
| **Meta Server**       | Service discovery entry point running in the same process as Config Service for Client/Portal lookup | 8080                      |
| **Config Service**    | Provides config read and long-polling notification endpoints for Client; embeds the service registry | 8080                      |
| **Admin Service**     | Provides configuration management APIs for Portal                                                    | 8090                      |
| **Eureka (Embedded)** | Embedded registry instance inside the Config Service process for Config/Admin Service registration and discovery; no separate deployment needed | Same as Config Service |
| **MySQL**             | Stores configuration data and metadata                                                               | 3306                      |

Apollo 2.0+ supports replacing the service registration and discovery implementation via SPI—for example, integrating Nacos, Consul, or Polaris. Under the default deployment model, however, Eureka is embedded inside Config Service and should not be mistaken for an external Eureka cluster that needs separate operations.

### Core Workflows

**Client Side (Fetching Configuration)**:

1. On startup, the Client queries Meta Server to obtain the list of Config Service addresses
2. The Client caches the service addresses locally (remaining functional even if Eureka fails)
3. The Client initiates long-polling requests to fetch configuration
4. Config Service responds immediately when it detects a configuration change
5. The Client updates its in-memory cache, triggers change callbacks, and **asynchronously persists the configuration to the local filesystem**. On Linux/Mac, the default cache directory is `/opt/data/{appId}/config-cache/`; on Windows, it defaults to `C:\opt\data\{appId}\config-cache\`, and can also be customized via the system property `apollo.cache-dir`

> **Disaster Recovery Mechanism**: Even if all Config Service instances go down and the application restarts, the Client can still read cached configuration from local disk to complete startup—ensuring application availability does not strictly depend on the configuration center.

**Portal Side (Publishing Configuration)**:

1. The user edits the configuration in Portal and clicks Publish
2. Portal invokes Admin Service's publish API
3. Admin Service writes the configuration to MySQL and generates a release version
4. Config Service notifies the Client via long polling that the configuration has changed
5. The Client re-fetches the latest configuration

### Client Usage Examples

Fetching configuration:

```java
Config config = ConfigService.getAppConfig();
String someKey = "someKeyFromDefaultNamespace";
String someDefaultValue = "someDefaultValueForTheKey";
String value = config.getProperty(someKey, someDefaultValue);
```

Listening for configuration changes:

```java
Config config = ConfigService.getAppConfig();
config.addChangeListener(new ConfigChangeListener() {
    @Override
    public void onChange(ConfigChangeEvent changeEvent) {
        // Handle configuration change
        for (String key : changeEvent.changedKeys()) {
            ConfigChange change = changeEvent.getChange(key);
            System.out.println(String.format(
                "Key: %s, Old: %s, New: %s",
                key, change.getOldValue(), change.getNewValue()));
        }
    }
});
```

In Spring Boot projects, production code normally avoids calling low-level APIs everywhere and instead leverages Apollo's Spring integration for injection and refresh—such as enabling Apollo with `@EnableApolloConfig` and binding or listening via `@Value`, `@ConfigurationProperties`, or `@ApolloConfigChangeListener`. Keep in mind that conditional beans (such as `@ConditionalOnProperty`) and already-initialized complex beans will not necessarily be recreated automatically when configuration changes, so critical configuration updates still need to be validated against your business refresh strategy.

## Core Model of Nacos Configuration Center

Nacos provides both configuration center and service discovery capabilities, which is one of its major differences from Apollo. From the configuration center perspective, Nacos typically uses a three-tier model to uniquely identify a configuration:

- **Namespace**: Typically used for environment or tenant isolation, such as `dev`, `test`, `prod`.
- **Group**: Typically used for business domain or application grouping; defaults to `DEFAULT_GROUP`.
- **DataId**: The specific configuration file or item identifier, such as `order-service.yaml`.

Nacos configuration storage also differs by deployment mode:

- **Production Cluster**: Using an external MySQL database to store configuration data is recommended, with data consistency primarily guaranteed by MySQL's own high-availability solution.
- **Embedded Storage**: Nacos also supports embedded storage such as Derby. In cluster mode, Nacos organizes each node's embedded storage into a logical cluster via JRaft—suitable for testing, small-scale deployments, or environments particularly sensitive to operational costs, though troubleshooting complexity is higher.

After Nacos 2.x introduced persistent gRPC connections, connection overhead between clients and servers became much lower than 1.x HTTP long polling. When a configuration changes, the server notifies the client that "a specific configuration has changed," and the client then pulls the latest configuration content and invokes its listeners. This avoids stuffing large configuration payloads directly into notification messages while making client-side local snapshots and disaster tolerance straightforward.

The Nacos client likewise maintains local snapshots. When the configuration center is unavailable, the client can read local snapshot/failover files to continue starting up or running; exact cache paths vary depending on client version, namespace, server address, Group, and DataId, so during troubleshooting check your target client version's logs and the local `nacos/config` directory.

## References

- [Nacos Official Documentation](https://nacos.io/docs/latest/what-is-nacos/)
- [Nacos Cluster Mode Deployment](https://nacos.io/docs/v2.5/manual/admin/deployment/deployment-cluster/)
- [Apollo Official Documentation (in Chinese)](https://www.apolloconfig.com/#/zh/README)
- [Apollo GitHub Repository](https://github.com/apolloconfig/apollo)
- [Spring Cloud Config Official Documentation](https://cloud.spring.io/spring-cloud-config/)
- [Spring Cloud Version Compatibility Matrix](https://spring.io/spring-cloud)
- [Kubernetes ConfigMap Official Documentation](https://kubernetes.io/docs/concepts/configuration/configmap/)
- [Nacos 1.1.0 Released with Canary Configuration Support (in Chinese)](https://nacos.io/zh-cn/blog/nacos%201.1.0.html)
- [Apollo in Practice at Youzan (in Chinese)](https://mp.weixin.qq.com/s/Ge14UeY9Gm2Hrk--E47eJQ)
- [Microservices Configuration Center Comparison (in Chinese)](https://www.itshangxp.com/spring-cloud/spring-cloud-config-center/)
