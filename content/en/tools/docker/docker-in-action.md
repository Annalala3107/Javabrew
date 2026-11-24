---
title: Docker in Action
description: "Understand Docker image and container management through hands-on practice, solve environment consistency and delivery efficiency challenges, and improve collaboration across development, testing, and deployment."
category: Developer Tools
tag:
  - Docker
lang: en
sourceRef: zh-ref/tools/docker/docker-in-action.md
head:
  - - meta
    - name: keywords
      content: Docker in Action,image building,container management,environment consistency,deployment,performance
---

## Introduction to Docker

Before we begin, let's briefly review Docker. For a more complete conceptual overview, see the previous article: [Docker Core Concepts Summary](./docker-intro.md).

### What Is Docker?

You can understand Docker from the following perspectives:

- Docker is a widely used software container platform, developed in Go.
- Docker packages an application together with its runtime dependencies into an image, reducing issues caused by inconsistencies across development, testing, and deployment environments.
- Users can easily create and use containers to run their applications. Containers can also be versioned, copied, shared, and modified just like regular source code.
- Docker can **encapsulate and isolate processes, making it an operating-system-level virtualization technology.** Because isolated processes are independent of the host and other isolated processes, they are called containers.

Official website: <https://www.docker.com/>.

![Understanding Containers](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/container-f3c06465.png)

### Why Use Docker?

Docker enables developers to package their applications and dependencies into a lightweight, portable container, and then publish it to any popular Linux machine—and achieve virtualization as well.

Containers strictly use a sandbox mechanism and have no interfaces exposed to one another (similar to apps on an iPhone). More importantly, containers have minimal performance overhead.

In traditional development workflows, projects often depend on services like MySQL, Redis, and Kafka. If these environments are all installed and configured manually, operations differ significantly across operating systems, easily leading to the classic "it works locally on my machine, not on yours" problem.

Docker solves this problem cleanly: we can run software environments such as MySQL and Redis inside containers, separating the application from the underlying environment architecture. Its advantages include:

1. Consistent runtime environments, making migration much easier
2. Encapsulated and isolated processes so containers do not interfere with each other, enabling more efficient utilization of system resources
3. The ability to replicate multiple identical containers from a single image

In addition, the open-source book [Docker — From Beginner to Practice](https://yeasy.gitbook.io/docker_practice/introduction/why) also outlines the reasons for using Docker.

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/20210412220015698-12635235.png)

## Installing Docker

### Windows

On Windows, installing Docker Desktop is recommended. Visit the official Docker website to download the installer:

![Installing Docker](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-install-windows-1968cd1c.png)

Then click `Get Started`:

![Installing Docker](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-install-windows-download-f0f1d136.png)

Click `Download for Windows` here to download the installer.

Currently, Docker Desktop for Windows recommends using the WSL 2 backend. Before installing, verify that your system meets the Docker Desktop version requirements and has WSL 2 enabled. In some scenarios, the Hyper-V backend can also be used, which can be enabled as follows. Open Control Panel and select Programs:

![Enabling Hyper-V](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-windows-hyperv-8ec44f98.png)

Click `Turn Windows features on or off`:

![Enabling Hyper-V](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-windows-hyperv-enable-d7b1bdda.png)

Check `Hyper-V` and click OK:

![Enabling Hyper-V](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-windows-hyperv-check-c4a1b8ce.png)

You will need to restart your computer after applying the change.

Once `Hyper-V` is enabled, you can install Docker Desktop. Launch the installer, wait a moment, and click `Ok`:

![Installing Docker](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-windows-hyperv-install-a21f46a3.png)

After installation completes, you will need to restart your computer again. After rebooting, if the following prompt appears:

![Installing Docker](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-windows-hyperv-wsl2-0c43cbfd.png)

If prompted during installation to use WSL 2, choosing the WSL 2 backend is generally preferred—it is the more common way to run Linux containers on Windows. Only switch to the Hyper-V backend if your environment specifically requires Hyper-V.

Since Docker Desktop uses a graphical user interface, we won't go into its specific UI operations here.

### macOS

Simply install it using Homebrew:

```shell
brew install --cask docker
```

### Linux

Next, let's see how to install Docker on Linux. Installation commands vary slightly across distributions, and for production environments it is best to follow the official Docker documentation. Here we demonstrate a quick installation method for testing or development environments using the official installation script.

To simplify installation in testing or development environments, Docker provides a convenient official installation script. Running this script automatically prepares everything needed and installs the stable version of Docker on your system.

```shell
curl -fsSL get.docker.com -o get-docker.sh
```

```shell
sh get-docker.sh --mirror Aliyun
```

Once installation finishes, start the Docker service directly:

```shell
systemctl start docker
```

It is recommended to enable Docker to start automatically on boot by running:

```shell
systemctl enable docker
```

## A Few Core Concepts in Docker

Before formally diving into Docker, we need to understand a few core concepts:

### Image

An image is a read-only template. Images are used to create Docker containers, and a single image can be used to create multiple containers.

### Container

A container is a running instance created from an image. Docker uses containers to run a single application or a group of applications independently. A container can be created, started, stopped, and deleted, and each container serves as an isolated, secure platform. You can think of a container as a lightweight Linux environment together with the application running inside it. A container's definition is almost identical to an image—both are a unified view of a stack of layers—the only difference being that the topmost layer of a container is readable and writable.

### Repository

A repository is a centralized place for storing image files. There is a distinction between a repository and a registry server: a registry server typically hosts multiple repositories, each repository contains multiple images, and each image has different tags. Repositories come in two forms: public and private. The most common public repository is Docker Hub, which stores a vast collection of images ready for direct download.

### Summary

In plain terms, an image represents a piece of software; running based on a specific image produces a program instance, and that instance is a container; and a repository is where all images in Docker are stored.

Repositories are further divided into remote repositories and local repositories—similar to Maven. If dependencies had to be downloaded from a remote server every single time, efficiency would drop drastically. Therefore, Maven downloads a dependency to the local repository on the first access, and on the second and third uses reads directly from the local repository. Docker's remote and local repositories serve a similar purpose.

## First Hands-On Experience with Docker

Let's try out Docker for the first time, using pulling a MySQL image as an example.

Just like GitHub, Docker provides Docker Hub for looking up image addresses and usage instructions. First, visit Docker Hub: [https://hub.docker.com/](https://hub.docker.com/)

![Docker Hub](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/dockerhub-com-58d64e61.png)

Enter `mysql` in the search box in the top-left corner and press Enter:

![Searching MySQL on Docker Hub](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/dockerhub-mysql-dcdc0f27.png)

As you can see, there are many MySQL-related images. If there is an `OFFICIAL IMAGE` badge in the top-right corner, it indicates an official image, so let's click the first MySQL image:

![MySQL Official Image](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/dockerhub-mysql-official-image-abf23cb3.png)

On the right, it provides the command `docker pull mysql` to download the MySQL image, though this pulls the version corresponding to the default tag. In real projects, it is strongly recommended to explicitly specify a version tag to avoid unpredictable environments.

If you want to download a specific version of the image, click `View Available Tags` below:

![Viewing other versions of MySQL](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/dockerhub-mysql-view-available-tags-0f84d7e7.png)

Here you can see all available versions of the image, with download commands on the right. For example, to download version 8.4 of the MySQL image, run:

```shell
docker pull mysql:8.4
```

In certain network environments, pulling images from Docker Hub may be slow or fail. However, it is not recommended to copy third-party registry mirror URLs found online indiscriminately, as the scope, synchronization policies, and availability of such services can change at any time.

Take Alibaba Cloud Container Registry (ACR) as an example: since July 2, 2024, its registry mirror accelerator has been restricted exclusively to Alibaba Cloud users on Alibaba Cloud products with public network access, and only supports pulling a limited scope of container images. Current official documentation also notes that the service has stopped syncing the latest images and that requests from non-Alibaba Cloud machines to the accelerator URL return HTTP 403. For specific restrictions, please refer to the [Alibaba Cloud ACR Mirror Accelerator Adjustment Announcement](https://help.aliyun.com/zh/acr/product-overview/product-change-acr-mirror-accelerator-function-adjustment-announcement) and the [Official Image Acceleration Documentation](https://help.aliyun.com/zh/acr/user-guide/accelerate-the-pulls-of-docker-official-images).

If you are using Alibaba Cloud ECS, you can configure the dedicated endpoint provided in the Alibaba Cloud console according to the official documentation. Do not blindly copy those settings in non-Alibaba Cloud environments; in production environments, it is advisable to reduce hard dependencies on external public registry services by syncing required images to a self-hosted or cloud-provider-managed private container registry and pinning image tags or digests.

## Docker Image Commands

Since Docker requires frequent operations on images, let's first learn the Docker image commands.

To see which images are currently present in Docker, use the `docker images` command:

```shell
[root@izrcf5u3j3q8xaz ~]# docker images
REPOSITORY    TAG       IMAGE ID       CREATED         SIZE
mysql         8.4       f07dfa83b528   11 days ago     448MB
tomcat        latest    feba8d001e3f   2 weeks ago     649MB
nginx         latest    ae2feff98a0c   2 weeks ago     133MB
hello-world   latest    bf756fb1ae65   12 months ago   13.3kB
```

Here, `REPOSITORY` is the image name, `TAG` is the version label, `IMAGE ID` is the unique ID of the image, `CREATED` is the creation time—note that this is not when we downloaded the image into Docker, but when the image author created it—and `SIZE` is the image size.

This command can also filter by a specified image name:

```shell
docker images mysql
```

Doing so lists all MySQL images present in Docker:

```shell
[root@izrcf5u3j3q8xaz ~]# docker images mysql
REPOSITORY   TAG       IMAGE ID       CREATED         SIZE
mysql        8.4       0ebb5600241d   11 days ago     589MB
mysql        8.0       f07dfa83b528   11 days ago     596MB
```

The command can also take the `-q` flag: `docker images -q`, where `-q` displays only the image IDs:

```shell
[root@izrcf5u3j3q8xaz ~]# docker images -q
0ebb5600241d
f07dfa83b528
feba8d001e3f
d404d78aa797
```

To download an image, run:

```shell
docker pull mysql:8.4
```

`docker pull` is the fixed command, followed by the image name and version tag you want to download; if you omit the version tag and run `docker pull mysql` directly, Docker pulls the version associated with the default tag.

Generally, before downloading an image, we search for what images are available so we can pull a specific version using:

```shell
docker search mysql
```

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-search-mysql-terminal-ce013aee.png)

However, `docker search` only searches image repositories and cannot list all tags of a given image. To check which versions MySQL supports, it is best to check the Tags page directly on Docker Hub.

```shell
docker pull mysql:8.4
```

If a tag does not exist, running `docker pull` returns an error similar to `manifest unknown`:

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-search-mysql-404-terminal-195b0b98.png)

To remove an image, use the command:

```shell
docker image rm mysql:8.4
```

If no version is specified, it defaults to removing the latest version (`latest`) as well.

You can also remove an image by specifying its image ID:

```shell
docker image rm bf756fb1ae65
```

However, an error occurs here:

```shell
[root@izrcf5u3j3q8xaz ~]# docker image rm bf756fb1ae65
Error response from daemon: conflict: unable to delete bf756fb1ae65 (must be forced) - image is being used by stopped container d5b6c177c151
```

This is because the `hello-world` image to be deleted is currently running, so the image cannot be removed directly. In this case, you need to force-delete it:

```shell
docker image rm -f bf756fb1ae65
```

This command deletes both the image and any containers created from that image, so use it with caution.

Docker also provides a shorthand version for deleting images: `docker rmi <image-name>:<tag>`.

With this, we can combine `rmi` and `-q` for batch operations. For example, if you want to delete all MySQL images right now, you would normally look up all MySQL image IDs and run `docker rmi` on them one by one. Alternatively, you can do:

```shell
docker rmi -f $(docker images mysql -q)
```

First, `docker images mysql -q` retrieves all MySQL image IDs (`-q` outputs IDs only) and passes those IDs as arguments to `docker rmi -f`, deleting all MySQL images in one shot.

## Docker Container Commands

Now that you have mastered image commands, let's learn container commands, since containers are based on images.

To run a container from an image, use:

```shell
docker run tomcat:8.0-jre8
```

Of course, running it requires having the image first, so pull the image beforehand:

```shell
docker pull tomcat:8.0-jre8
```

Once the download finishes, you can run it, and then inspect currently running containers with `docker ps`:

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-ps-terminal-fc7f39ff.png)

Here, `CONTAINER_ID` is the container ID, `IMAGE` is the image name, `COMMAND` is the command executing inside the container, `CREATED` is when the container was created, `STATUS` is the container's status, `PORTS` shows the ports the service inside the container is listening on, and `NAMES` is the container's name.

Tomcat started in this way cannot be accessed directly from outside because containers are isolated. If you want to access Tomcat inside the container directly via port 8080, you must map the host port to the container port:

```shell
docker run -p 8080:8080 tomcat:8.0-jre8
```

Let's explain what the two ports mean (`8080:8080`): the first `8080` is the host port, and the second `8080` is the port inside the container. External requests hitting port 8080 on the host are forwarded via port mapping to port 8080 inside the container.

Now Tomcat can be accessed from outside:

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-run-tomact-8080-f0b9703c.png)

If you map the ports like this instead:

```shell
docker run -p 8088:8080 tomcat:8.0-jre8
```

then external clients need to visit port 8088 to access Tomcat. Note that each running container is independent of the others, so running multiple Tomcat containers simultaneously will not cause port conflicts.

Containers can also run in the background (detached mode) so they do not occupy your terminal:

```shell
docker run -d -p 8080:8080 tomcat:8.0-jre8
```

When starting a container, Docker assigns it a random default name, but you can actually specify a custom name using:

```shell
docker run -d -p 8080:8080 --name tomcat01 tomcat:8.0-jre8
```

Here, the container name becomes `tomcat01`. Container names must be unique.

Let's also extend our knowledge of `docker ps` flags, such as `-a`:

```shell
docker ps -a
```

This flag lists all containers, both running and stopped.

The `-q` flag queries only the IDs of running containers: `docker ps -q`.

```shell
[root@izrcf5u3j3q8xaz ~]# docker ps -q
f3aac8ee94a3
074bf575249b
1d557472a708
4421848ba294
```

Combining them lists the IDs of all containers, both running and stopped: `docker ps -qa`.

```shell
[root@izrcf5u3j3q8xaz ~]# docker ps -aq
f3aac8ee94a3
7f7b0e80c841
074bf575249b
a1e830bddc4c
1d557472a708
4421848ba294
b0440c0a219a
c2f5d78c5d1a
5831d1bab2a6
d5b6c177c151
```

Next are the commands for starting, restarting, and stopping containers; since they are very straightforward, we won't elaborate too much on them.

```shell
docker start c2f5d78c5d1a
```

This command starts an already stopped container. You can start it using either the container ID or the container name.

```shell
docker restart c2f5d78c5d1a
```

This command restarts the specified container.

```shell
docker stop c2f5d78c5d1a
```

This command gracefully stops the specified container.

```shell
docker kill c2f5d78c5d1a
```

This command forcefully kills the specified container immediately.

All of the commands above work with both container IDs and container names.

---

After a container is stopped, it is no longer running, yet it still exists. To delete it, run:

```shell
docker rm d5b6c177c151
```

Note that you don't need to type the full container ID—just enough leading characters to uniquely identify it.

If you want to remove a currently running container, you need to add the `-f` flag to force removal:

```shell
docker rm -f d5b6c177c151
```

To remove all containers, use the combined command:

```shell
docker rm -f $(docker ps -qa)
```

First, `docker ps -qa` retrieves all container IDs, and then `docker rm -f` deletes them all.

---

When a container runs in the background, we cannot immediately see its runtime status. If you need to inspect the container's runtime logs, use:

```shell
docker logs 289cc00dc5ed
```

By default, this does not stream logs in real time. To follow logs live, add the `-f` flag:

```shell
docker logs -f 289cc00dc5ed
```

With the `-t` flag, timestamps are also displayed alongside log entries, typically combined with `-f`:

```shell
docker logs -ft 289cc00dc5ed
```

---

To check which processes are running inside a container, use:

```shell
docker top 289cc00dc5ed
```

If you want to interact with the container via a shell, use:

```shell
docker exec -it 289cc00dc5ed bash
```

Your terminal will enter inside the container, and commands you run will take effect inside the container. Inside a container, typically only basic shell utilities such as `ls` and `cd` are available. To exit the container terminal and return to CentOS, simply run `exit`.

Now that we can enter the container terminal and run commands, how do we deploy a project into the Tomcat container?

```shell
docker cp ./test.html 289cc00dc5ed:/usr/local/tomcat/webapps
```

The `docker cp` command copies files from CentOS into the container. `./test.html` is the source path on CentOS, `289cc00dc5ed` is the container ID, and `/usr/local/tomcat/webapps` is the destination path inside the container. The `test.html` file will now be copied into that path.

```shell
[root@izrcf5u3j3q8xaz ~]# docker exec -it 289cc00dc5ed bash
root@289cc00dc5ed:/usr/local/tomcat# cd webapps
root@289cc00dc5ed:/usr/local/tomcat/webapps# ls
test.html
root@289cc00dc5ed:/usr/local/tomcat/webapps#
```

If you want to copy a file from inside the container back out to CentOS, simply reverse the source and destination arguments:

```shell
docker cp 289cc00dc5ed:/usr/local/tomcat/webapps/test.html ./
```

So to deploy a project now, you simply upload the project to CentOS, copy it from CentOS into the container, and run the container.

---

Although starting software environments with Docker is very easy, it also brings a small challenge: we cannot immediately see the container's internal details, such as listening ports, bound IP addresses, and so on. Fortunately, Docker already thought of this—simply run:

```shell
docker inspect 923c969b0d91
```

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-inspect-terminal-b4506c14.png)

## Docker Volumes

After learning container commands, let's explore Docker volumes. Volumes enable file sharing between the host machine and containers, with the key benefit that modifying files on the host directly affects the container without needing to repeatedly copy files from the host into the container.

Suppose we want to mount the host's `/opt/apps` directory to the `webapps` directory inside the container; we write the command like this:

```shell
docker run -d -p 8080:8080 --name tomcat01 -v /opt/apps:/usr/local/tomcat/webapps tomcat:8.0-jre8
```

However, visiting Tomcat right now shows that it cannot be reached:

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-data-volume-webapp-8080-c4115ee3.png)

This actually proves our volume mount succeeded! Docker synchronizes the container's `webapps` directory with `/opt/apps`. Since `/opt/apps` is currently empty, `webapps` also becomes an empty directory, which is why Tomcat returns 404.

Now we only need to add files to `/opt/apps`, and the `webapps` directory will automatically contain the same files, achieving file sharing. Let's test it:

```shell
[root@centos-7 opt]# cd apps/
[root@centos-7 apps]# vim test.html
[root@centos-7 apps]# ls
test.html
[root@centos-7 apps]# cat test.html
<h1>This is a test html!</h1>
```

We created a `test.html` file in `/opt/apps`. Does the `webapps` directory inside the container have this file now? Let's enter the container's terminal:

```shell
[root@centos-7 apps]# docker exec -it tomcat01 bash
root@115155c08687:/usr/local/tomcat# cd webapps/
root@115155c08687:/usr/local/tomcat/webapps# ls
test.html
```

Indeed, the file is already inside the container! Next, let's write a simple web application:

```java
public class HelloServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.getWriter().println("Hello World!");
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        doGet(req,resp);
    }
}
```

This is a very simple Servlet. Once we package and upload it into `/opt/apps`, it will automatically sync into the container, and we can access it right away:

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/docker/docker-data-volume-webapp-8080-hello-world-d8da63bb.png)

This approach is typically called a **bind mount**, because the host directory path is specified explicitly by us. Docker also provides another common volume mechanism: **named volumes**.

```shell
docker run -d -p 8080:8080 --name tomcat01 -v aa:/usr/local/tomcat/webapps tomcat:8.0-jre8
```

Here, `aa` is not a host directory, but a volume name. Docker automatically creates a volume named `aa` and copies the existing contents of the container's `webapps` directory into the volume. By default, Docker-managed volumes are stored under `/var/lib/docker/volumes`:

```shell
[root@centos-7 volumes]# pwd
/var/lib/docker/volumes
[root@centos-7 volumes]# cd aa/
[root@centos-7 aa]# ls
_data
[root@centos-7 aa]# cd _data/
[root@centos-7 _data]# ls
docs  examples  host-manager  manager  ROOT
```

Modifying the contents of that directory affects the container directly. However, in real-world projects, modifying files directly under `/var/lib/docker/volumes` is not recommended; prefer managing data through containers, applications, or explicit bind-mounted host directories.

---

Finally, let's introduce a few more container- and image-related commands:

```shell
docker commit -m "description" -a "image author" tomcat01 my_tomcat:1.0
```

This command packages a container into a new image. Checking the images list:

```shell
[root@centos-7 _data]# docker images
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
my_tomcat           1.0                 79ab047fade5        2 seconds ago       463MB
tomcat              8                   a041be4a5ba5        2 weeks ago         533MB
mysql               8.4                 db2b37ec6181        2 months ago        589MB
```

If you want to back up (export) an image to an archive file, run:

```shell
docker save my_tomcat:1.0 -o my-tomcat-1.0.tar
```

```shell
[root@centos-7 ~]# docker save my_tomcat:1.0 -o my-tomcat-1.0.tar
[root@centos-7 ~]# ls
anaconda-ks.cfg  initial-setup-ks.cfg  公共  视频  文档  音乐
get-docker.sh    my-tomcat-1.0.tar     模板  图片  下载  桌面
```

If you have a `.tar` image archive, how do you load it back into Docker? Run:

```shell
docker load -i my-tomcat-1.0.tar
```

```shell
root@centos-7 ~]# docker load -i my-tomcat-1.0.tar
b28ef0b6fef8: Loading layer [==================================================>]  105.5MB/105.5MB
0b703c74a09c: Loading layer [==================================================>]  23.99MB/23.99MB
......
Loaded image: my_tomcat:1.0
[root@centos-7 ~]# docker images
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
my_tomcat           1.0                 79ab047fade5        7 minutes ago       463MB
```

## Common Troubleshooting Commands

Once you get started with Docker, the commands you will use most frequently in practice are troubleshooting commands. It is strongly recommended to get familiar with the following commands:

```shell
# Inspect container startup parameters, network settings, mounted directories, and environment variables
docker inspect tomcat01

# View the most recent container logs
docker logs --tail=100 tomcat01

# Stream container logs continuously
docker logs -f tomcat01

# Monitor container resource usage
docker stats

# Check disk space consumed by Docker
docker system df
```

Be careful when cleaning up resources, especially with commands carrying `-f`. `docker system prune` removes unused containers, networks, images, and build cache; if you also pass `--volumes`, unused volumes will be deleted as well, which could wipe out databases or local test data.
