---
title: Docker Core Concepts Summary
description: "An overview of Docker core concepts and the differences between containers and virtual machines, covering the relationships among images, containers, and repositories, as well as their practical value in delivery and deployment."
category: Developer Tools
tag:
  - Docker
lang: en
sourceRef: zh-ref/tools/docker/docker-intro.md
head:
  - - meta
    - name: keywords
      content: Docker,container,image,repository,engine,isolation,VM comparison,deployment
---

This article focuses on Docker's core concepts, runtime model, and common usage scenarios without diving into the installation process. For installation steps, command practice, and starting local services, see the follow-up article [Docker in Action](./docker-in-action.md).

## Introduction to Containers

Docker is a widely used software container platform. To truly understand Docker, you first need to understand what problem containers actually solve.

### What Is a Container?

#### First, the More Official Definition of a Container

**In one sentence: a container packages software into standardized units for development, shipment, and deployment.**

- **A container image is a lightweight, standalone, executable package of software** that includes everything needed to run an application: code, runtime, system tools, system libraries, and settings.
- **Containerized software works for both Linux- and Windows-based applications and runs consistently across any environment.**
- **Containers give software independence**, isolating it from differences in external environments (for example, discrepancies between development and staging environments), which helps reduce conflicts between teams running different software on the same infrastructure.

#### Next, a More Everyday Explanation of a Container

If I had to explain a container in plain terms, I think of a container as a place to store things—just like a backpack holds stationery, a wardrobe holds clothes, and a shoe rack holds shoes. In our context, what a container holds tends to be applications such as websites, programs, or even entire system environments.

![Understanding Containers](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/container-f3c06465.png)

### Physical Machines, Virtual Machines, and Containers Illustrated

We will cover the comparison between virtual machines and containers in detail later. Here, a few diagrams from the web will help reinforce the differences among physical machines, virtual machines, and containers (the images below are sourced from the internet).

**Physical Machine:**

![Physical Machine](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/.jpeg-5e717e56.jpg)

**Virtual Machine:**

![Virtual Machine](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/.jpeg-76fa0c60.jpg)

**Container:**

![](/media/jg/ext/oss.javaguide.cn/javaguide/image-20211110104003678-30e480c8.png)

From these three conceptual diagrams, we can summarize by analogy: **containers virtualize the operating system rather than hardware, and containers share the same underlying operating system resources. Traditional virtualization emulates a set of hardware and runs a full operating system on top of it. Consequently, containers provide a slightly lower level of isolation.**

### Containers vs. Virtual Machines

Whenever containers come up, comparing them with virtual machines is inevitable. In my view, neither is meant to replace the other—instead, the two can coexist harmoniously.

Simply put: **containers and virtual machines have similar resource isolation and allocation benefits, but function differently because containers virtualize the operating system instead of hardware. Containers are more portable and efficient.**

Traditional virtual machine technology emulates a complete set of hardware and runs a full operating system on top of it, within which the required application processes execute. In contrast, application processes inside a container run directly on the host kernel—the container has no separate kernel of its own and performs no hardware virtualization. As a result, containers are much more lightweight than traditional virtual machines.

![](/media/jg/ext/oss.javaguide.cn/javaguide/2e2b95eebf60b6d03f6c1476f4d7c697-89a60e45.png)

**Comparison between containers and virtual machines**:

![](/media/jg/ext/oss.javaguide.cn/javaguide/4ef8691d67eb1eb53217099d0a691eb5-6271f3da.png)

- A container is an abstraction at the app layer that packages code and dependencies together. Multiple containers can run on the same machine and share the OS kernel with other containers, each running as isolated processes in user space. Compared to VMs, **containers take up less space** (container images are typically tens of MBs in size) and **can start almost instantly**.

- A virtual machine (VM) is an abstraction of physical hardware that turns one server into many servers. The hypervisor allows multiple VMs to run on a single machine. Each VM includes a full copy of an operating system, one or more applications, and the necessary binaries and libraries—taking up **tens of GBs / large amounts of space**. VMs can also be **slow to boot**.

Through Docker's official documentation, we learn about all of these advantages of Docker, yet there is no need to dismiss virtual machine technology altogether, as the two serve different use cases. **Virtual machines excel at completely isolating entire runtime environments**—for example, cloud service providers commonly use VM technology to isolate different tenants. **Docker, on the other hand, is typically used to isolate different applications**, such as frontend, backend, and database services.

In my opinion, it is not a matter of one replacing the other; both can coexist seamlessly.

![](/media/jg/ext/oss.javaguide.cn/javaguide/056c87751b9dd7b56f4264240fe96d00-d9855aa3.png)

## Introduction to Docker

### What Is Docker?

You can understand Docker from the following perspectives:

- **Docker is a software container platform.**
- **Docker** is developed in Go and leverages Linux kernel features such as `cgroups`, `namespaces`, and UnionFS to encapsulate and isolate processes, making it an operating-system-level virtualization technology.
- Docker packages an application together with its runtime dependencies into an image, reducing issues caused by inconsistencies across development, testing, and deployment environments.
- Users can easily create and use containers to run their applications. Containers can also be versioned, copied, shared, and modified just like regular source code.

**Docker Philosophy**:

- **Shipping Container**: Like intermodal shipping containers in maritime transport, a Docker container holds an application and all its dependencies, ensuring it runs identically in any environment.
- **Standardization**: Standardized transport methods, storage formats, and API interfaces.
- **Isolation**: Each Docker container runs in its own isolated environment, separated from the host machine and other containers.

### Characteristics of Docker Containers

- **Lightweight**: Multiple Docker containers running on the same machine share that machine's OS kernel; they start up rapidly and consume very little compute and memory resources. Images are constructed from layered filesystems and share common files, minimizing disk usage and speeding up image downloads.
- **Standardized**: Docker containers are based on open standards, enabling them to run across all major Linux distributions, Microsoft Windows, and any infrastructure including VMs, bare-metal servers, and the cloud.
- **Secure**: The isolation Docker provides applies not only between containers, but also separates them from the underlying infrastructure. Docker provides strong isolation by default, so an issue in one application remains contained within a single container without affecting the entire machine.

### Why Use Docker?

- Docker images provide a complete runtime environment (excluding the kernel), guaranteeing consistency across environments so you no longer hear "well, it worked on my machine!" — *Consistent runtime environment*
- Achieves startup times on the order of seconds or even milliseconds, greatly saving development, testing, and deployment time. — *Faster startup times*
- Avoids interference from other users' workloads on shared servers. — *Isolation*
- Well-suited for handling sudden spikes in server traffic. — *Elastic scaling and rapid expansion*
- Makes it easy to migrate an application running on one platform to another without worrying that environment changes will break the application. — *Easy portability*
- Enables Continuous Integration, Continuous Delivery, and Deployment (CI/CD) via customized application images. — *Continuous delivery and deployment*

---

## Core Concepts of Docker

There are three essential core concepts in Docker: Image, Container, and Repository.

Once you understand these three concepts, you understand the entire Docker lifecycle.

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-build-run-e0832a5d.png)

### Image: A Special Filesystem

**An operating system is divided into kernel space and user space.** For Linux, once the kernel boots, it mounts the root filesystem to provide user-space support. A Docker image is essentially a root filesystem.

**A Docker image is a special filesystem that, in addition to providing the programs, libraries, resources, and configuration files required at container runtime, also contains configuration parameters prepared for runtime (such as anonymous volumes, environment variables, users, etc.).** An image contains no dynamic data, and its contents never change once built.

When designing Docker, its creators made full use of **Union FS** technology to implement a **layered storage architecture**. An image is actually composed of multiple filesystem layers stacked together.

**During image builds, layers are constructed one by one, with each layer serving as the foundation for the next. Once a layer is built, it never changes; any modifications in a subsequent layer occur solely within that layer.** For instance, deleting a file from an earlier layer does not actually remove the file from that previous layer—it merely marks the file as deleted in the current layer. When the container runs, the file will not be visible, yet the file still remains inside the image itself. Therefore, you should be extra careful when building images: each layer should contain only what belongs to that layer, and any temporary or extra files should be cleaned up before the layer finishes building.

This layered storage characteristic also makes reusing and customizing images much easier. You can take a previously built image as a base layer, add new layers on top to customize what you need, and build a new image.

### Container: The Runtime Instance of an Image

The relationship between an Image and a Container is just like that between a Class and an Instance in Object-Oriented Programming: an image is a static definition, whereas **a container is the runtime entity of an image. Containers can be created, started, stopped, deleted, paused, and so on.**

**In essence, a container is a process, but unlike a process executed directly on the host, a container process runs within its own isolated namespace. Just as images use layered storage, containers do as well.**

**The lifecycle of a container's writable storage layer is tied to the container itself—when the container is destroyed, its storage layer disappears along with it. Therefore, any data saved inside the container's storage layer is lost when the container is deleted.**

Following Docker best practices, **containers should not write business/application data into their own storage layer**; the container storage layer should remain as stateless as possible. **Files requiring persistence should use Volumes or bind mounts to a host directory**, as reads and writes to these bypass the container storage layer and go directly to the host machine or network storage, offering better performance and stability. A Volume's lifecycle is independent of the container—removing a container does not automatically delete the Volume.

### Repository: A Centralized Place to Store Image Files

Once an image is built, it is easy to run on the current host. However, **if you need to use this image on other servers, you need a centralized service for storing and distributing images—that is what Docker Registry does.**

A single Docker Registry can contain multiple Repositories; each Repository can contain multiple Tags; and each Tag corresponds to an image. Therefore, **an image repository is a centralized place where Docker stores image files, similar to the code repositories we are already familiar with.**

Typically, **a single repository holds different versions of the same software**, and **tags are used to identify each version of that software**. You can specify a particular image using the format `<repository-name>:<tag>`. If no tag is provided, `latest` is used by default. However, in production environments, relying on `latest` is discouraged—it is much better to pin explicit version tags for easier rollbacks and troubleshooting.

**Let's also clarify the distinction between public Docker Registry services and private Docker Registries:**

A **public Docker Registry service** is open to users for managing images. Generally, these public services allow users to upload and download public images for free, and may offer paid tiers for managing private images.

The most commonly used public Registry service is the official **Docker Hub**, which is also the default Registry and hosts a vast collection of high-quality official images at [https://hub.docker.com/](https://hub.docker.com/ "https://hub.docker.com/"). Here is how Docker officially describes Docker Hub:

> Docker Hub is a service provided by Docker for finding and sharing container images with your team.

For example, suppose we want to search for an image we need:

![Searching for images on Docker Hub](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/Screen-Shot-2019-11-04-at-8.21.39-PM-dcb4ce92.png)

In Docker Hub search results, several key indicators help us pick the right image:

- **OFFICIAL Image**: Indicates that the image is provided and maintained by Docker itself, meaning relatively higher stability and security.
- **Stars**: Similar to likes or GitHub Stars.
- **Downloads**: Represents how many times the image has been pulled, giving a good indication of how frequently it is used.

Of course, besides searching directly on the Docker Hub website, we can also use the `docker search` command to search images on Docker Hub, which returns the same results.

```bash
➜  ~ docker search mysql
NAME                              DESCRIPTION                                     STARS               OFFICIAL            AUTOMATED
mysql                             MySQL is a widely used, open-source relation…   8763                [OK]
mariadb                           MariaDB is a community-developed fork of MyS…   3073                [OK]
mysql/mysql-server                Optimized MySQL Server Docker images. Create…   650                                     [OK]
```

Accessing **Docker Hub** from Mainland China can be relatively slow, so enterprise projects typically combine an internal company image registry or a cloud provider's container registry for image caching and distribution.

Beyond using public services, users can also **deploy a private Docker Registry locally**. Docker officially provides the `registry` image, which can be used directly as a private Registry service. The open-source Docker Registry image provides only the server-side implementation of the Docker Registry API, which is sufficient to support Docker CLI commands without affecting basic usage, though it does not include a web UI or advanced features such as image maintenance, user management, or access control.

### Relationship Among Image, Container, and Repository

The diagram below clearly illustrates the relationship among Image, Container, Repository, and Registry/Hub:

![Docker Architecture](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-regitstry-e6d73400.png)

- A `Dockerfile` is a text file containing a series of instructions and parameters that define how to build a Docker image. When you run `docker build` and specify a `Dockerfile`, Docker reads the instructions in the file, builds a new image step by step, and saves it locally.
- The `docker pull` command downloads an image from a specified Registry/Hub to the local machine (Docker Hub by default).
- The `docker run` command creates and starts a new container from a local image. If the image does not exist locally, Docker first attempts to pull it from the Registry/Hub.
- The `docker push` command uploads a local Docker image to a specified Registry/Hub.

We touched on a few basic Docker commands above; they will be covered in detail in the hands-on article that follows.

### Build, Ship, and Run

With the core concepts of Docker covered, let's talk about: Build, Ship, and Run.

If you look up the Docker official website, you will come across the slogan: **"Docker - Build, Ship, and Run Any App, Anywhere"**. So what do Build, Ship, and Run actually mean?

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-build-ship-run-9106dea4.jpg)

- **Build (Building an Image)**: The image is like a shipping container holding files, the runtime environment, and other resources.
- **Ship (Shipping an Image)**: Transporting images between hosts and repositories—here, the repository acts like a massive port terminal.
- **Run (Running an Image)**: A running image is a container, which is where the program actually executes.

The Docker workflow is simply pulling an image from a repository to your local machine and running a single command to turn that image into a live container. Therefore, we often refer to Docker as a dock worker or stevedore, which matches its common translation as a "porter / dock worker".

## Common Docker Commands

### Basic Commands

```bash
docker version # Check Docker version
docker images # List all downloaded images (equivalent to: docker image ls)
docker container ls # List all containers
docker ps # List currently running containers
docker image prune # Clean up unused image files; -a/--all removes all images not used by any container
```

### Pulling Images

The default Registry used by `docker pull` is Docker Hub. When you run `docker pull` without specifying a Registry address, Docker pulls the image from Docker Hub.

```bash
docker search mysql # Search for MySQL-related images
docker pull mysql:8.4 # Pull the MySQL image
docker image ls # List all downloaded images
```

### Building Images

When you run the `docker build` command and specify a `Dockerfile`, Docker reads the instructions inside the `Dockerfile`, builds a new image step by step, and stores it locally.

```bash
# image-name is the image name, and 1.0.0 is the image version or tag
docker build -t image-name:1.0.0 .
```

Note: The `Dockerfile` does not have to be named `Dockerfile`, nor does it have to reside in the root directory of the build context. Using the `-f` or `--file` flag lets you specify any file at any location as the `Dockerfile`. Of course, by convention, people usually stick to the default filename `Dockerfile` and place it inside the image build context directory.

### Removing Images

For example, suppose we want to delete the MySQL image we downloaded earlier.

Before deleting an image with `docker rmi [image]` (equivalent to `docker image rm [image]`), you must first ensure that no container is referencing that image. You can delete it by tag name or image ID, and you can use the `docker ps` command covered earlier to see if any container is currently using it.

```shell
➜  ~ docker ps
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                               NAMES
c4cd691d9f80        mysql:5.7           "docker-entrypoint.s…"   7 weeks ago         Up 12 days          0.0.0.0:3306->3306/tcp, 33060/tcp   mysql
```

We can see that `mysql:5.7` is currently referenced by the container with ID `c4cd691d9f80`, so we first need to stop that container using `docker stop c4cd691d9f80` or `docker stop mysql`.

Next, inspect the MySQL image ID:

```shell
➜  ~ docker images
REPOSITORY              TAG                 IMAGE ID            CREATED             SIZE
mysql                   5.7                 f6509bac4980        3 months ago        373MB
```

You can then delete it using either `IMAGE ID` or `REPOSITORY:TAG`:

```shell
docker rmi f6509bac4980 # or docker rmi mysql:5.7
```

### Pushing Images

The `docker push` command is used to upload a local Docker image to a specified Registry/Hub.

```bash
# Push the image to a private Harbor image registry
# harbor.example.com is the private registry address, ubuntu is the image name, and 18.04 is the version tag
docker push harbor.example.com/ubuntu:18.04
```

Before pushing an image, make sure the Docker image you want to push has already been built locally. In addition, be sure to log in to the target image registry first.

## Docker Data Management

There are two primary ways to manage data in containers:

1. Volumes
2. Bind mounts (mounting a host directory)

![Docker Data Management](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-data-management-e50221db.png)

Volumes are data storage areas managed by Docker and have the following characteristics:

- Can be shared and reused across containers.
- Data inside a volume is not automatically deleted even if the container is removed, ensuring data persistence.
- Changes made to a volume take effect immediately.
- Updates to a volume do not affect the image.

```bash
# Create a volume
docker volume create my-vol
# List all volumes
docker volume ls
# Inspect detailed information about a volume
docker volume inspect my-vol
# Remove a specified volume
docker volume rm my-vol
```

When using the `docker run` command, use the `--mount` flag to mount one or more volumes into the container.

You can also use `--mount` to mount a file or directory from the host into the container, giving the container direct access to the host filesystem. By default, Docker mounts host directories with read-write permissions, though you can add `readonly` to restrict it to read-only access.

## Docker Compose

### What Is Docker Compose and What Does It Do?

Docker Compose is an official Docker tool for defining and running multi-container applications. With Compose, developers can use a single YAML file to describe the multiple services, networks, ports, and volumes an application depends on, and then start or stop the entire stack with a single command.

Docker Compose is an open-source project hosted at <https://github.com/docker/compose>.

Core capabilities of Docker Compose:

- **Multi-container management**: Allows users to define and manage multiple containers in a single YAML file.
- **Service orchestration**: Configures networking and dependency relationships between containers.
- **One-command startup and teardown**: Easily starts and stops the entire application using commands like `docker compose up` and `docker compose down`.

Docker Compose simplifies the development, testing, and deployment of multi-container applications, boosts developer productivity, and reduces deployment complexity and management overhead.

### Basic Structure of a Docker Compose File

The Docker Compose file is the centerpiece of the Docker Compose tool, used to define and configure multi-container Docker applications. This file is typically named `compose.yaml` or `docker-compose.yml` and is written in YAML (YAML Ain't Markup Language).

The basic structure of a Docker Compose file is as follows:

- **`services`**: Defines each container (service) in the application. Each service can use different images, environment settings, and dependencies.
  - **`image`**: Starts containers from the specified image; can be a repository/tag or an image ID.
  - **`command`**: Optional; overrides the default command executed after the container starts. Used to run a specific command or script at startup, such as launching an application or executing initialization scripts.
  - **`ports`**: Optional; maps ports between the container and the host machine.
  - **`depends_on`**: Configures startup dependency order between services. For instance, if a backend service depends on a database service, the database can be started before the backend service.
  - **`environment`**: Optional; sets environment variables required for the service to run.
  - **`restart`**: Optional; controls the container's restart policy, automatically restarting the container according to the specified policy when it exits.
  - **`volumes`**: Optional; defines volumes used by the service for data persistence or sharing data between containers.
  - **`build`**: Specifies the build context path containing the `Dockerfile` used to build an image, or a detailed build configuration object.
- **`networks`**: Defines network connections between containers.
- **`volumes`**: Top-level volume definitions for data persistence and sharing. Commonly used for persisting database storage, configuration files, logs, and similar data.

```yaml
services:
  service-name-1:
    image: nginx:stable
    command: ["nginx", "-g", "daemon off;"]
    environment:
      TZ: Asia/Shanghai
    volumes:
      - web_data:/usr/share/nginx/html
    networks:
      - app_net
    ports:
      - "8080:80"
    restart: unless-stopped
    depends_on:
      - service-name-2
  service-name-2:
    image: redis:7
    networks:
      - app_net

volumes:
  web_data:

networks:
  app_net:
```

### Common Docker Compose Commands

#### Starting Services

`docker compose up` creates and starts containers based on the services defined in the Compose file and connects them to the network created by Compose. If no custom network is declared in the file, Compose automatically creates a default network.

```bash
# Look for compose.yaml or docker-compose.yml in the current directory and start the services defined within
docker compose up
# Start in the background (detached mode)
docker compose up -d
# Force recreate all containers even if they already exist
docker compose up --force-recreate
# Rebuild images before starting
docker compose up --build
# Specify particular service name(s) to start instead of starting all services
# Multiple services can be specified separated by spaces
docker compose up service-name
```

Additionally, if the Compose file is not named `compose.yaml` or `docker-compose.yml`, you can specify it using the `-f` flag:

```bash
docker compose -f compose.prod.yaml up
```

#### Stopping Services

`docker compose down` stops and removes the containers and networks created by `docker compose up`.

```bash
# Look for the Compose file in the current directory
# Stop and remove the containers and networks started according to its definitions
docker compose down
# Stop containers without removing them
docker compose stop
# Stop a specific service
docker compose stop service-name
```

Similarly, if the Compose file is not named `compose.yaml` or `docker-compose.yml`, you can specify it using the `-f` flag:

```bash
docker compose -f compose.prod.yaml down
```

#### Inspecting Services

`docker compose ps` displays status information for all containers started via `docker compose up`.

```bash
# View status information for all containers
docker compose ps
# Display only service names
docker compose ps --services
# View containers for a specific service
docker compose ps service-name
```

#### Other Commands

| Command                  | Description                                        |
| ------------------------ | -------------------------------------------------- |
| `docker compose version` | Show Docker Compose version                        |
| `docker compose images`  | List images used by the created containers         |
| `docker compose kill`    | Force stop service containers                      |
| `docker compose exec`    | Execute a command inside a running container       |
| `docker compose logs`    | View output logs from services                     |
| `docker compose pause`   | Pause services                                     |
| `docker compose unpause` | Unpause services                                   |
| `docker compose push`    | Push service images                                |
| `docker compose start`   | Start existing stopped service containers          |
| `docker compose stop`    | Stop currently running service containers          |
| `docker compose rm`      | Remove stopped service containers                  |
| `docker compose top`     | Display running processes inside containers        |

## Underlying Principles of Docker

First, Docker is software built on lightweight virtualization technology. What, then, is virtualization technology?

In simple terms, virtualization technology can be defined as follows:

> Virtualization is a resource-management technology that abstracts and transforms various [physical resources](https://zh.wikipedia.org/wiki/%E8%A8%88%E7%AE%97%E6%A9%9F%E7%A7%91%E5%AD%B8) of a computer ([CPU](https://zh.wikipedia.org/wiki/CPU), [memory](https://zh.wikipedia.org/wiki/%E5%86%85%E5%AD%98), [disk space](https://zh.wikipedia.org/wiki/%E7%A3%81%E7%9B%98%E7%A9%BA%E9%97%B4), [network adapters](https://zh.wikipedia.org/wiki/%E7%B6%B2%E8%B7%AF%E9%81%A9%E9%85%8D%E5%99%A8), etc.) so they can be partitioned and combined into one or more computing environments. This breaks down the indivisible boundaries of physical structures, allowing users to utilize computer hardware resources more effectively than with the original physical setup. These newly virtualized portions of resources are not constrained by how existing resources are deployed, where they are located geographically, or their physical configuration. Virtualized resources generally refer to computing capacity and data storage.

Docker technology originally grew out of LXC (Linux Containers) virtual container technology.

> LXC, short for Linux Containers, is an operating-system-level virtualization technology that serves as a user-space interface for Linux kernel containment features. It packages application software into a software container holding the application's code along with the required OS core and libraries. By using unified namespaces and shared APIs to allocate available hardware resources across different software containers, it creates an isolated sandbox runtime environment for applications, enabling Linux users to easily create and manage system or application containers.

LXC relies primarily on the `cgroup` and `namespace` capabilities provided by the Linux kernel to create an independent OS runtime environment for software.

**Overview of `cgroup` and `namespace`:**

- **`namespace` is the mechanism the Linux kernel uses to isolate kernel resources.** Through namespaces, some processes can see only a subset of resources relevant to themselves, while other processes see only their own resources, making the two groups completely unaware of each other's existence. This is implemented by assigning the relevant resources of one or more processes to the same namespace. Linux namespaces encapsulate and isolate global system resources so that processes in different namespaces have their own independent view of global system resources; changing a system resource inside one namespace affects only processes in that namespace and has no impact on processes in other namespaces.

  (The above introduction to `namespace` is adapted from <https://www.cnblogs.com/sparkdev/p/9365405.html>; see that post for further details on namespaces.)

- **`cgroup` (short for Control Groups) is a Linux kernel mechanism for limiting, accounting, and isolating the physical resources (such as CPU, memory, I/O, etc.) used by process groups.**

  (The above introduction to `cgroup` is adapted from <https://www.ibm.com/developerworks/cn/linux/1506_cgroup/index.html>; see that post for further details on `cgroup`.)

**Comparison between `cgroup` and `namespace`:**

Both group processes together, yet their roles are fundamentally different: `namespace` isolates resources between groups of processes, whereas `cgroup` monitors and restricts resource consumption across a group of processes in a unified manner.

## Summary

This article has walked through Docker's core concepts and common commands in detail. To go from zero to hands-on practice, check out [Docker: From Getting Started to Hands-On Practice](https://javaguide.cn/tools/docker/docker-in-action.html), which covers the practical steps in great detail!

In addition, I highly recommend the open-source book [Docker — From Beginner to Practice](https://yeasy.gitbook.io/docker_practice/introduction/why). Because the book is open-source, its contents are continuously updated and stay very fresh.

![Homepage of Docker — From Beginner to Practice](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-getting-started-practice-website-homepage-f309a0bb.png)

## References

- [Docker Compose: A Comprehensive Guide from Scratch to Production](https://juejin.cn/post/7306756690727747610)
- [Linux Namespace and Cgroup](https://segmentfault.com/a/1190000009732550)
- [LXC vs Docker: Why Docker is Better](https://www.upguard.com/articles/docker-vs-lxc "LXC vs Docker: Why Docker is Better")
- [CGroup Introduction, Application Examples, and Underlying Principles](https://www.ibm.com/developerworks/cn/linux/1506_cgroup/index.html)
