---
title: "ZooKeeper Hands-On Tutorial: Docker Deployment, zkCli Commands, Four-Letter Commands, and Curator Client"
category: Distributed Systems
description: "ZooKeeper hands-on tutorial covering Docker installation and deployment, common zkCli commands, four-letter commands, Curator Java client CRUD operations, and a ZooKeeper-based distributed lock example."
tag:
  - ZooKeeper
head:
  - - meta
    - name: keywords
      content: ZooKeeper,ZooKeeper Hands-On,ZooKeeper Installation,zkCli,Curator,Four-Letter Commands,Docker Deployment,Distributed Lock,ZooKeeper Tutorial
lang: en
sourceRef: zh-ref/distributed-system/distributed-process-coordination/zookeeper/zookeeper-in-action.md
---

This article demonstrates the usage of common ZooKeeper commands as well as the basic usage of the ZooKeeper Java client Curator. Everything covered here consists of fundamental operations sufficient for everyday work.

This article focuses on hands-on practice and does not explain *why* ZooKeeper can perform coordination. It is recommended to read [ZooKeeper Getting Started Guide](./zookeeper-intro.md) first to learn about ZNode, Watcher, and Session, and then read [ZooKeeper Advanced Guide](./zookeeper-plus.md) or [ZAB Protocol Explained](../../protocol/zab.md) to fill in the protocol and cluster mechanisms.

If there is anything in this article that can be improved or refined, feel free to point it out in the comments so we can learn together!

## Installing ZooKeeper

### Installing ZooKeeper Using Docker

**a. Pull ZooKeeper using Docker**

```shell
docker pull zookeeper:3.5.8
```

**b. Run ZooKeeper**

```shell
docker run -d --name zookeeper -p 2181:2181 zookeeper:3.5.8
```

### Connecting to the ZooKeeper Service

**a. Enter the ZooKeeper container**

First run `docker ps` to find ZooKeeper's `ContainerID`, then enter the container using `docker exec -it ContainerID /bin/bash`.

**b. Navigate into the `bin` directory, then connect to the ZooKeeper service via `./zkCli.sh -server 127.0.0.1:2181`**

```bash
root@eaf70fc620cb:/apache-zookeeper-3.5.8-bin# cd bin
```

If you see output printed in the console like the screenshot below, you have successfully connected to the ZooKeeper service.

![Connecting to ZooKeeper Service](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/zookeeper/connect-zooKeeper-service-fa68db2a.png)

## Demonstration of Common ZooKeeper Commands

### Viewing Common Commands (`help` Command)

Use the `help` command to list common ZooKeeper CLI commands.

### Creating Nodes (`create` Command)

Use the `create` command to create the `node1` node under the root directory with the associated string `"node1"`:

```shell
[zk: 127.0.0.1:2181(CONNECTED) 34] create /node1 “node1”
```

Use the `create` command to create a child node under `node1` with the associated value `123`:

```shell
[zk: 127.0.0.1:2181(CONNECTED) 1] create /node1/node1.1 123
Created /node1/node1.1
```

### Updating Node Data (`set` Command)

```shell
[zk: 127.0.0.1:2181(CONNECTED) 11] set /node1 "set node1"
```

### Retrieving Node Data (`get` Command)

The `get` command retrieves both the data payload and the status metadata of a specified node. As shown below, the `set` command has updated the node's data content to `"set node1"`.

```shell
[zk: zookeeper(CONNECTED) 12] get -s /node1
set node1
cZxid = 0x47
ctime = Sun Jan 20 10:22:59 CST 2019
mZxid = 0x4b
mtime = Sun Jan 20 10:41:10 CST 2019
pZxid = 0x4a
cversion = 1
dataVersion = 1
aclVersion = 0
ephemeralOwner = 0x0
dataLength = 9
numChildren = 1

```

### Listing Child Nodes Under a Directory (`ls` Command)

Use the `ls` command to list nodes under the root directory:

```shell
[zk: 127.0.0.1:2181(CONNECTED) 37] ls /
[dubbo, ZooKeeper, node1]
```

Use the `ls` command to list nodes under `/node1`:

```shell
[zk: 127.0.0.1:2181(CONNECTED) 5] ls /node1
[node1.1]
```

The `ls` command in ZooKeeper is similar to `ls` in Linux: it lists all direct child nodes under the given absolute `path` (one level only, not recursively).

### Checking Node Status (`stat` Command)

Use the `stat` command to inspect node status:

```shell
[zk: 127.0.0.1:2181(CONNECTED) 10] stat /node1
cZxid = 0x47
ctime = Sun Jan 20 10:22:59 CST 2019
mZxid = 0x47
mtime = Sun Jan 20 10:22:59 CST 2019
pZxid = 0x4a
cversion = 1
dataVersion = 0
aclVersion = 0
ephemeralOwner = 0x0
dataLength = 11
numChildren = 1
```

Fields shown above such as `cversion`, `aclVersion`, and `numChildren` were already introduced in "[ZooKeeper Key Concepts Summary (Getting Started)](https://javaguide.cn/distributed-system/distributed-process-coordination/zookeeper/zookeeper-intro.html)".

### Viewing Node Info and Status (`ls2` Command)

The `ls2` command acts like a combination of `ls` and `stat`. The output returned by `ls2` consists of 2 parts:

1. The list of child nodes
2. The `stat` metadata of the current node

```shell
[zk: 127.0.0.1:2181(CONNECTED) 7] ls2 /node1
[node1.1]
cZxid = 0x47
ctime = Sun Jan 20 10:22:59 CST 2019
mZxid = 0x47
mtime = Sun Jan 20 10:22:59 CST 2019
pZxid = 0x4a
cversion = 1
dataVersion = 0
aclVersion = 0
ephemeralOwner = 0x0
dataLength = 11
numChildren = 1

```

### Deleting Nodes (`delete` Command)

This command is very simple, except you must note that if you want to delete a node, that node must have no child nodes.

```shell
[zk: 127.0.0.1:2181(CONNECTED) 3] delete /node1/node1.1
```

Later I will introduce how to use the Java client API as well as the open-source ZooKeeper clients ZkClient and Curator.

## Basic Usage of the ZooKeeper Java Client Curator

Curator is an open-source ZooKeeper Java client framework created by Netflix. Compared to the native client bundled with ZooKeeper, Curator offers cleaner abstractions and makes various APIs much more convenient to use.

![](/media/jg/ext/oss.javaguide.cn/javaguide/distributed-system/zookeeper/curator-310c2cc4.png)

Let's walk through a simple demonstration of how to use Curator!

Curator 4.0+ has good compatibility with ZooKeeper 3.5.x. Before starting, add the following dependencies to your project:

```xml
<dependency>
    <groupId>org.apache.curator</groupId>
    <artifactId>curator-framework</artifactId>
    <version>4.2.0</version>
</dependency>
<dependency>
    <groupId>org.apache.curator</groupId>
    <artifactId>curator-recipes</artifactId>
    <version>4.2.0</version>
</dependency>
```

### Connecting with the ZooKeeper Client

Create a `CuratorFramework` instance via `CuratorFrameworkFactory`, and then call the `start()` method on `CuratorFramework`!

```java
private static final int BASE_SLEEP_TIME = 1000;
private static final int MAX_RETRIES = 3;

// Retry strategy. Retry 3 times, and will increase the sleep time between retries.
RetryPolicy retryPolicy = new ExponentialBackoffRetry(BASE_SLEEP_TIME, MAX_RETRIES);
CuratorFramework zkClient = CuratorFrameworkFactory.builder()
    // the server to connect to (can be a server list)
    .connectString("127.0.0.1:2181")
    .retryPolicy(retryPolicy)
    .build();
zkClient.start();
```

Explanation of basic parameters:

- `baseSleepTimeMs`: Initial wait time between retries
- `maxRetries`: Maximum number of retries
- `connectString`: List of servers to connect to
- `retryPolicy`: Retry policy

### CRUD Operations on Data Nodes

#### Creating Nodes

As introduced in [ZooKeeper Common Concepts Explained](./zookeeper-intro.md), we usually categorize znodes into 4 major types:

- **Persistent (`PERSISTENT`) Node**: Once created, it remains until explicitly deleted, even if the ZooKeeper cluster crashes/restarts.
- **Ephemeral (`EPHEMERAL`) Node**: The lifecycle of an ephemeral node is bound to the **client session**; **when the session ends, the node disappears**. Additionally, **ephemeral nodes can only be leaf nodes** and cannot have child nodes.
- **Persistent Sequential (`PERSISTENT_SEQUENTIAL`) Node**: In addition to having the properties of a persistent (`PERSISTENT`) node, its child node names carry sequential ordering, such as `/node1/app0000000001` and `/node1/app0000000002`.
- **Ephemeral Sequential (`EPHEMERAL_SEQUENTIAL`) Node**: In addition to having the properties of an ephemeral (`EPHEMERAL`) node, its child node names carry sequential ordering.

When working with ZooKeeper, you will notice that the `CreateMode` enum actually defines 7 znode types, though the 4 listed above are the most commonly used.

**a. Creating a persistent node**

You can create persistent nodes in either of the two ways below:

```java
// Note: The code below will throw an error; the exact reason is explained below
zkClient.create().forPath("/node1/00001");
zkClient.create().withMode(CreateMode.PERSISTENT).forPath("/node1/00002");
```

However, running the code above throws an error because the parent node `node1` has not been created yet.

You can create the parent node `node1` first, and then running the code above will succeed without error:

```java
zkClient.create().forPath("/node1");
```

A more recommended approach is the line below: **`creatingParentsIfNeeded()` ensures parent nodes are automatically created if they do not exist, which is very handy.**

```java
zkClient.create().creatingParentsIfNeeded().withMode(CreateMode.PERSISTENT).forPath("/node1/00001");
```

**b. Creating an ephemeral node**

```java
zkClient.create().creatingParentsIfNeeded().withMode(CreateMode.EPHEMERAL).forPath("/node1/00001");
```

**c. Creating a node and specifying its data payload**

```java
zkClient.create().creatingParentsIfNeeded().withMode(CreateMode.EPHEMERAL).forPath("/node1/00001","java".getBytes());
zkClient.getData().forPath("/node1/00001");// Retrieve the node's data content; returns a byte array
```

**d. Checking whether a node was created successfully**

```java
zkClient.checkExists().forPath("/node1/00001");// If not null, the node was created successfully
```

#### Deleting Nodes

**a. Deleting a child node**

```java
zkClient.delete().forPath("/node1/00001");
```

**b. Deleting a node along with all of its child nodes**

```java
zkClient.delete().deletingChildrenIfNeeded().forPath("/node1");
```

#### Getting / Updating Node Data Content

```java
zkClient.create().creatingParentsIfNeeded().withMode(CreateMode.EPHEMERAL).forPath("/node1/00001","java".getBytes());
zkClient.getData().forPath("/node1/00001");// Retrieve the node's data content
zkClient.setData().forPath("/node1/00001","c++".getBytes());// Update the node's data content
```

#### Getting All Child Node Paths of a Node

```java
List<String> childrenPaths = zkClient.getChildren().forPath("/node1");
```
