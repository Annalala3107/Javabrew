---
title: Summary of Linux Fundamentals
description: A concise introduction to essential Linux concepts and common commands that every Java engineer must know.
category: CS Basics
tag:
  - Operating System
  - Linux
head:
  - - meta
    - name: keywords
      content: Linux, basic commands, distributions, filesystem, permissions, processes, networking
lang: en
sourceRef: zh-ref/cs-basics/operating-system/linux-intro.md
---

A brief overview of essential Linux concepts and common commands that every Java programmer should know.

## Exploring Linux

### Introduction to Linux

What Linux is can be summarized in three main points:

- **Unix-like System**: Linux is a free, open-source Unix-like operating system.
- **Linux Strictly Refers to the Linux Kernel**: Strictly speaking, the term "Linux" refers solely to the Linux kernel. A standalone Linux kernel cannot function on its own as a complete, usable operating system. Hence, various Linux distributions exist.
- **Father of Linux (Linus Benedict Torvalds)**: A legendary figure in the software engineering world, an admired trailblazer! He was the original creator of the **Linux kernel**, subsequently launched the open-source project, and serves as its chief architect. He also created the Git open-source project and was its primary developer.

![Linux Founder Linus Torvalds](/media/jg/ext/oss.javaguide.cn/cs-basics/operating-system/linux/linux-father-b8753a27.png)

### The Birth of Linux

In 1989, Linus Torvalds joined the Finnish Army Uusimaa Brigade for 11 months of mandatory military service, holding the rank of second lieutenant and primarily serving in the computer department on ballistic calculations. During his service, he purchased Andrew S. Tanenbaum's operating system textbook along with the Minix source code, beginning his study of operating systems. In 1990, after completing his military duty, he returned to university and was introduced to Unix.

> **Minix** is a miniature Unix-like operating system created by Professor Tanenbaum for educational purposes, built upon a microkernel architecture. It inspired the creation of the Linux kernel.

In 1991, Linus Torvalds open-sourced the Linux kernel. Linux adopted an adorable penguin as its official mascot, symbolizing daring action and love for life.

![Linux Operating System Logo](/media/jg/ext/oss.javaguide.cn/cs-basics/operating-system/linux/Linux-Logo-26f92e87.jpg)

### Common Linux Distributions

![Linux Operating System Desktop and Command-line Interfaces](/media/jg/ext/oss.javaguide.cn/cs-basics/operating-system/linux/linux-95faaf8a.jpg)

What Linus Torvalds open-sourced was solely the Linux kernel; we previously mentioned the role of an operating system kernel. Various organizations and vendors bundle the Linux kernel with diverse applications, system documentation, graphical installers, and administrative configuration tools, forming Linux distributions (distros).

> The kernel is primarily responsible for system memory management, hardware device management, file system management, and process/application lifecycle management.

Linux distributions can generally be categorized into two major classes:

- **Commercial vendor-maintained distributions**: Such as Red Hat Enterprise Linux (RHEL), maintained and supported by Red Hat.
- **Community-maintained distributions**: Such as CentOS (historically derived from RHEL) and Debian-based Ubuntu.

For beginners learning Linux, blindly choosing CentOS is no longer recommended. CentOS Linux 8 reached End of Life (EOL) at the end of 2021, and CentOS Linux 7 reached EOL in June 2024; the current CentOS Stream is an upstream continuous delivery branch for RHEL, positioned differently from the historical "stable, binary-compatible rebuild of RHEL."

More dependable choices today include:

- If you want to learn enterprise server environments and the RHEL ecosystem: Prioritize Rocky Linux or AlmaLinux.
- If you want quick onboarding, extensive documentation, and widespread use across desktop and cloud servers: Choose Ubuntu LTS.
- If you prefer rock-solid stability, lightweight foot-print, and adherence to pure community distributions: Choose Debian.

If your company's production environment still runs CentOS, you can naturally align your learning with that specific environment; however, for new learning and sandbox environments, choosing actively maintained distributions is strongly advised.

## The Linux File System

### Overview of the Linux File System

In the Linux operating system, all resources managed by the kernel—such as network interface cards, disk drives, printers, input/output peripherals, regular files, and directories—are treated as files. This represents a foundational concept in Linux: "Everything is a file."

This concept stems from the UNIX philosophy of abstracting all system resources into file representations for unified management and access. Linux's virtual file system architecture borrows heavily from UNIX design philosophies. This design enables Linux to manage and manipulate disparate resource types via a unified file interface (`read`, `write`, `open`, `close`), greatly streamlining system interaction. For instance, interacting with network interfaces, storage drives, and virtual device nodes uses operations very similar to reading and writing regular files.

This file-centric design grants Linux tremendous flexibility and extensibility, making it an extraordinarily versatile operating system favored and championed by engineers worldwide.

### Understanding the inode

The inode is the bedrock of Linux/Unix file systems. What exactly is an inode, and what role does it play?

The inode concept can be summarized in five core points:

1. Hard drives use sectors as their smallest physical storage unit, while operating systems and file systems read and write data in blocks (Blocks), which consist of multiple contiguous sectors. Traditional disk sectors are typically 512 bytes, while modern disks frequently use 4 KB physical sectors (e.g., 512e / 4Kn devices); file system block sizes are also commonly 4 KB, but the two are distinct concepts. File metadata (such as permissions, size, modification timestamps, and data block / extent pointers) is recorded within an inode (index node). An inode number is guaranteed to be unique only within a given file system; multiple hard link directory entries can point to the exact same inode. While Solid-State Drives (SSDs) lack physical mechanical sectors, they still expose logical block interfaces to the host.
2. In file systems like ext2/ext3/ext4, the on-disk inode structure size is fixed when formatting the file system; other Linux file systems may employ different metadata layout strategies.
3. Inode access is extremely fast because the system can directly locate a file's metadata via its inode number without traversing directory trees repeatedly.
4. File systems such as ext2/ext3/ext4 fix the total number of available inodes at creation time. Once all inodes are exhausted, new files cannot be created even if ample data block capacity remains. Note that not all Linux file systems use fixed inode tables; troubleshooting requires considering specific filesystem implementations.
5. You can use the `stat` command to view a file's inode details, including inode number, file type, access permissions, owner, file size, and timestamps.

In simple terms: An inode is the data structure maintaining how a file's data blocks are mapped, where each block resides, who owns the file, creation and modification timestamps, access permissions, and size.

To summarize the distinction between inode and block:

- **inode**: Stores file metadata attributes; use the `stat` command to inspect inode details.
- **block / extent**: Stores actual file contents or defines contiguous ranges of data blocks. Allocation and sharing behaviors depend on the specific file system and cannot be simplified into "a block always belongs exclusively to one file."

![Viewing file inode details using the stat command](/media/jg/local/cs-basics/operating-system/images/inode-2a480a.png)

Linux/Unix file systems use inodes to identify filesystem objects. When renaming a file within the same file system, only directory entries are updated; the inode number remains unchanged. When the last hard link to a file is removed and no running process holds an open file descriptor to it, the inode is reclaimed, and its number may be reused later. Accessing a file by path always involves resolving directory entries first; you cannot bypass path lookup and treat inode numbers as stable global file identifiers.

Using inode numbers abstracts the file system for users and applications, requiring system commands or standard system call APIs to query and manage inode metadata.

### Hard Links and Symbolic Links

On Linux and Unix-like systems, hard links and symbolic links have fundamentally different implementations: a hard link is simply another directory entry pointing to the same existing inode, whereas a symbolic link is a distinct, standalone file possessing its own inode.

**1. Hard Link**

- In Linux/Unix file systems, every file and directory has a unique index node (inode) number identifying it. Hard links associate an additional directory entry with an existing inode number; the hard link and original file share the identical inode number. From the file system's perspective, they enjoy completely equal status (effectively mutual hard links pointing to the identical underlying data). Deleting either entry has zero impact on the other, making hard links useful for guarding critical files against accidental deletion.
- A file's underlying data blocks and inode are genuinely freed only after the original directory entry and all associated hard links are deleted (and no open descriptors remain).
- Hard links have specific constraints: you cannot create hard links to directories, nor to non-existent target paths, and hard links cannot cross file system boundaries.
- The `ln` command without flags creates hard links.

**2. Soft Link (Symbolic Link or Symlink)**

- A symbolic link has an inode number distinct from the target file, and its data content stores a target path string.
- If the original file is deleted, the symbolic link persists, but points to an invalid, broken file path (dangling symlink).
- Symbolic links are conceptually analogous to shortcuts in Windows.
- Unlike hard links, symbolic links can link to directories or non-existent files, and can freely span across different file systems.
- The `ln -s` command creates symbolic links.

**Why Can't Hard Links Cross File Systems?**

As explained earlier, hard links establish connections through inode numbers, sharing the exact same inode number as the source file.

Every file system maintains its own independent inode namespace; directory entries within a file system can only reference inodes belonging to that specific file system, and cannot directly address an inode in another mounted file system. Therefore, hard links cannot cross file system boundaries—this is an architectural limitation, not a simple matter of inode ID collisions.

### Linux File Types

Linux supports multiple file types. The primary file types include: **regular files**, **directory files**, **link files**, **device files**, **FIFO pipe files**, and **socket files**.

- **Regular File (`-`)**: Used for storing binary data or plain text. Users can view, edit, or delete them based on access permissions. Examples: images, audio, PDFs, text files, videos, source code, and binaries.
- **Directory File (`d`)**: Directories are also files; they organize and manage files within the system, containing lists of file names and child directory pointers. Opening a directory is functionally opening a directory file.
- **Symbolic Link File (`l`)**: Stores a target path string. When accessed, the kernel resolves the path to redirect to the target file or directory.
- **Character Device (`c`)**: Provides unbuffered, stream-oriented access to character devices such as keyboards and serial ports.
- **Block Device (`b`)**: Provides buffered access to block storage devices such as hard drives and SSDs.
- **Named Pipe (`p`, FIFO)**: A specialized file type used for inter-process communication (IPC).
- **Socket (`s`)**: Used for inter-process network communication across machines, or local IPC via Unix domain sockets.

Each file type serves specific purposes and carries distinct attributes, which can be inspected using commands like `ls -l` or `file`.

```bash
# Regular file (-)
-rw-r--r--  1 user  group  1024 Apr 14 10:00 file.txt

# Directory file (d)
drwxr-xr-x  2 user  group  4096 Apr 14 10:00 directory/

# Socket file (s)
srwxrwxrwx  1 user  group    0 Apr 14 10:00 socket
```

### The Linux Directory Tree

Linux organizes files and directories in a single unified hierarchical structure known as the directory tree. The directory tree starts at the root directory (`/`) and branches downward into subdirectories, forming an inverted tree.

![Linux Directory Structure](/media/jg/local/cs-basics/operating-system/images/Linux-835de3.png)

**Common Directory Explanations:**

- **/bin:** Contains essential binary executables (`ls`, `cat`, `mkdir`, etc.); primary system commands reside here.
- **/etc:** Stores host-specific system administration configurations and service settings.
- **/home:** Base directory for regular users' personal home folders. For instance, user `user`'s home directory is `/home/user`, commonly referenced as `~user` or `~`.
- **/usr:** Secondary hierarchy containing user utilities, shared libraries, and applications.
- **/opt:** Reserved for optional third-party add-on application software packages (e.g., standalone installations of Tomcat, custom middleware).
- **/proc:** Virtual pseudo-filesystem providing a window into kernel data structures, process tables, and hardware status in memory.
- **/root:** Home directory for the superuser (system administrator, `root`).
- **/sbin:** Contains essential system binaries intended for system administration tasks, typically executable only by root (e.g., `ifconfig`, `fdisk`, `reboot`).
- **/dev:** Contains device nodes representing hardware devices.
- **/mnt:** Temporary mount point for system administrators to manually mount external filesystems.
- **/boot:** Contains static files required for bootstrapping the operating system (kernel images, initramfs, GRUB bootloader files).
- **/lib and /lib64:** Essential shared libraries and kernel modules required for binaries in `/bin` and `/sbin`.
- **/tmp:** Temporary storage accessible by all users and processes.
- **/var:** Variable data directory for files modified during system operation, such as log files (`/var/log`), spool queues, and runtime state.
- **/lost+found:** Present on ext-based file systems; stores recovered orphan file fragments following an unclean shutdown or filesystem check (`fsck`).

## Commonly Used Linux Commands

Below is a curated summary of frequently used commands.

A helpful online Linux command quick-reference handbook is available at: <https://wangchujiang.com/linux-command/>.

![Linux Command Quick Lookup](/media/jg/ext/oss.javaguide.cn/cs-basics/operating-system/linux/linux-command-search-518ebe2b.png)

Additionally, [shell.how](https://www.shell.how/) helps explain shell commands, aiding your understanding of basic Linux syntax and tools like Git and NPM.

![shell.how Usage Example](/media/jg/ext/oss.javaguide.cn/cs-basics/operating-system/linux/shell-now-3faa8c8a.png)

### Directory Navigation

- `cd usr`: Change directory to the `usr` folder under the current path.
- `cd ..` (or `cd ../`): Move up to the parent directory.
- `cd /`: Switch to the system root directory.
- `cd ~`: Switch to the current user's home directory.
- **`cd -`:** Switch back to the previous working directory.

### Directory Operations

- `ls`: List directory contents. E.g., `ls /home` lists files and directories under `/home`.
- `ll`: An alias for `ls -l`, displaying detailed file metadata (permissions, owner, size, timestamp).
- `mkdir [options] directory_name`: Create a new directory. E.g., `mkdir -m 755 my_directory` creates `my_directory` with 755 permissions (owner has read/write/execute; group and others have read/execute). If open read/write/execute access for everyone is desired, use `mkdir -m 777 my_directory`.
- `find [path] [expression]`: Recursively search for files and directories matching conditions. Highly versatile: ① List all files and directories recursively from the current folder: `find .`; ② Find files ending in `.txt` under `/home`: `find /home -name "*.txt"`, case-insensitive: `find /home -iname "*.txt"`; ③ Find all `.txt` and `.pdf` files under the current directory: `find . \( -name "*.txt" -o -name "*.pdf" \)`.
- `pwd`: Print the absolute path of the current working directory.
- `rmdir [options] directory_name`: Remove empty directories. E.g., `rmdir -p my_directory` removes `my_directory` and its parent directories if they become empty.
- `rm [options] file_or_directory`: Remove files or directories. E.g., `rm -r my_directory` recursively (`-r`) deletes `my_directory` along with all nested contents.
- `cp [options] source target`: Copy files or directories. E.g., `cp file.txt /home/file.txt` copies `file.txt` into `/home`. `cp -r source destination` recursively copies directory `source` to `destination`, preserving attributes and nested hierarchies.
- `mv [options] source target`: Move or rename files and directories. E.g., `mv file.txt /home/file.txt` moves `file.txt` into `/home`. Unlike `cp`, `mv` relocates existing items without duplicating their count.

### File Operations

Commands like `mv`, `cp`, and `rm` apply to both files and directories.

- `touch [options] file_name...`: Create new empty files or update timestamps of existing files. E.g., `touch file1.txt file2.txt file3.txt`.
- `ln [options] <source> <link>`: Create hard links or symbolic links. E.g., `ln -s file.txt file_link` creates a symlink named `file_link` pointing to `file.txt`. The `-s` option denotes symbolic.
- `cat / more / less / tail file_name`: View file contents. The command `tail -f file` dynamically follows appends to a file, making it ideal for monitoring application logs like Tomcat (`tail -f catalina-2016-11-11.log`).
- `vim file_name`: Edit file contents. Vim is an advanced, powerful modal text editor built on vi. In daily backend development, Vim is primarily used for editing configuration files. Typical workflow: `vim file ------> Open file -----> Normal Mode ------> Press 'i' for Insert Mode -----> Edit text -------> Press 'Esc' for Normal/Command Mode -----> Type ':wq' or ':q!'` (`:wq` writes and quits; `:q!` forces quit without saving changes).

### File Compression and Archiving

**1) Archiving and Compressing:**

In Linux, tar archives typically end in `.tar`, while gzip compression produces `.gz`. Generally, archiving and compression are performed together, yielding `.tar.gz` files.

Command: `tar -zcvf archive_name.tar.gz files_to_compress`, where:

- `z`: Filter the archive through gzip.
- `c`: Create a new archive.
- `v`: Verbosely list files processed.
- `f`: Specify archive filename.

Example: If `test/` contains `aaa.txt`, `bbb.txt`, and `ccc.txt`, you can archive and compress them using: `tar -zcvf test.tar.gz aaa.txt bbb.txt ccc.txt` or `tar -zcvf test.tar.gz /test/`.

**2) Extracting Archives:**

Command: `tar [-xvf] archive_name`

Where `x` extracts files from an archive.

Examples:

- Extract `test.tar.gz` into the current directory: `tar -xvf test.tar.gz`.
- Extract `test.tar.gz` into `/usr`: `tar -xvf test.tar.gz -C /usr` (`-C` specifies destination directory).

### File Transfer

- `scp [options] source destination` (Secure Copy): Transmits files securely over SSH between local and remote hosts. E.g., `scp -r my_directory user@remote:/home/user` uploads a local directory to a remote server; `scp -r user@remote:/home/user/my_directory .` downloads a remote directory. Ensure the target host runs an SSH daemon and authentication is configured.
- `rsync [options] source destination`: Synchronizes files efficiently between hosts, copying only modified deltas to conserve bandwidth and time. E.g., `rsync -r my_directory user@remote:/home/user`.
- `ftp` (File Transfer Protocol): Connects to remote FTP servers for file uploads and downloads (`put`, `get`, `delete`).

### File Permissions

Every file and directory possesses specific permissions, an owning user, and an owning group. Permissions restrict resource access across three categories: read (`r`), write (`w`), and execute (`x`). These apply respectively to three scopes: the file owner (`u`), the owning group (`g`), and other users (`o`).

Run **`ls -l`** to view file permissions and metadata within a directory.

Example: Running `ls -l` in a directory:

![Linux file permissions command example](/media/jg/local/cs-basics/operating-system/images/Linux-c747b4.png)

Explanation of the first column:

![Linux file permissions field breakdown](/media/jg/local/cs-basics/operating-system/images/Linux-efdb5f.png)

> Detailed breakdown of file types, permissions, owner, group, and others:

**File Types:**

- `d`: Directory.
- `-`: Regular file.
- `l`: Symbolic link.

**Permission Values:**

- `r`: Read permission, represented numerically by 4.
- `w`: Write permission, represented numerically by 2.
- `x`: Execute permission, represented numerically by 1.

**Differences Between File and Directory Permissions:**

Permissions carry distinct meanings for files versus directories.

For files:

| Permission | Permitted Operation |
| :--- | ---: |
| `r` | View file contents with commands like `cat` |
| `w` | Modify or append to file contents |
| `x` | Execute the file as a program or script |

For directories:

| Permission | Permitted Operation |
| :--- | ---: |
| `r` | Read directory listing (`ls`) |
| `w` | Create, rename, or delete files inside directory |
| `x` | Traverse directory (`cd` through or enter) |

Traditional `root` generally possesses capabilities that bypass standard Discretionary Access Control (DAC) permission checks; however, this does not mean root can bypass all restrictions, such as Linux Capabilities, LSMs (SELinux/AppArmor), mount options (`ro`, `noexec`), or filesystem immutable attributes (`chattr +i`). An object with `000` permissions cannot be simply assumed to be executable or accessible by root in all circumstances.

**Every Linux user must belong to at least one group. Files have an owner, a group, and others:**

- **Owner (`u`)**: Typically the creator of the file. Inspect with `ls -ahl`; change ownership using `chown username filename`.
- **Group (`g`)**: The group assigned to the file, initially the primary group of the creator. Inspect with `ls -ahl`; change using `chgrp groupname filename`.
- **Others (`o`)**: All other users who are neither the owner nor members of the file's group.

**Changing Permissions: `chmod`**

Example: Grant owner full permissions (`rwx`), group read/write (`rw`), and others read-only (`r`) on `aaa.txt`:

**`chmod u=rwx,g=rw,o=r aaa.txt`** or **`chmod 764 aaa.txt`**

![chmod Linux file permission modification example](/media/jg/local/cs-basics/operating-system/images/asset-3daf07.png)

**Configuring Service Auto-start:**

If we install a service like ZooKeeper, how do we configure it to start automatically on system boot?

Modern mainstream Linux distributions utilize `systemd` for service management. The recommended approach is creating a `zookeeper.service` unit file, then using systemctl:

```bash
sudo systemctl enable zookeeper
sudo systemctl start zookeeper
sudo systemctl status zookeeper
```

If you edit the `.service` unit file, run `sudo systemctl daemon-reload` first so systemd picks up configuration changes. Commands like `chkconfig --add zookeeper` and `chkconfig --list` belong to the legacy SysV init era and are only relevant in older distributions or compatibility layers.

### User Management

Linux is a multi-user, multitasking time-sharing operating system. Any user requiring access to system resources must authenticate using a registered account.

User accounts assist administrators in tracking activity, auditing resource consumption, and providing security isolation.

**User Management Commands:**

- `useradd [options] username`: Create a new user account. Accounts created via `useradd` are stored in `/etc/passwd`.
- `userdel [options] username`: Delete a user account.
- `usermod [options] username`: Modify user account properties (UID, shell, home directory, group memberships).
- `passwd [options] username`: Manage password and aging policies. E.g., `passwd -S username` displays password status; `passwd -d username` deletes password (whether blank password logins are allowed depends on PAM configuration); `passwd -l username` locks password authentication (SSH key authentication may remain functional); `passwd username` updates password.
- `su [options] username` (Switch User): Switch user identity within the current session.

### Group Management

Each user belongs to a user group, enabling centralized permission management across multiple users. Group definitions and memberships are recorded in `/etc/group`.

**Group Management Commands:**

- `groupadd [options] group_name`: Create a new user group.
- `groupdel group_name`: Delete an existing group.
- `groupmod [options] group_name`: Modify group properties (e.g., GID, group name).

### System Status and Diagnostics

- `top [options]`: Display dynamic real-time CPU utilization, memory consumption, load average, and process states.
- `htop [options]`: Enhanced interactive process viewer supporting color schemes, mouse scrolling, and interactive management.
- `uptime [options]`: Show system uptime, active user sessions, and 1, 5, 15-minute load averages.
- `vmstat [interval] [count]`: Report virtual memory statistics, run queue length (`r`), blocked tasks (`b`), context switches (`cs`), and I/O metrics.
- `free [options]`: Display physical RAM and swap usage, including buffers and page cache.
- `df [options] [filesystem]`: Report filesystem disk space usage, free space, and mount points (e.g., `df -h`, `df -a`).
- `du [options] [path]`: Summarize disk space usage of specific files or directories.
- `sar [options] [interval] [count]`: Collect, report, and save cumulative historical performance metrics (CPU, RAM, disk I/O, network).
- `ps [options]`: Snapshot current processes. `ps -ef` and `ps aux` list running processes with distinct formatting styles. For example: `ps aux | grep redis` or `pgrep redis -a`.
- `systemctl [command] [service_name]`: Manage systemd services and units (start, stop, restart, status, enable).
- `journalctl [options]`: Query systemd system logs. E.g., `journalctl -u nginx -f` streams live Nginx service logs; `journalctl -xe` views recent system errors with full context.

### Networking Commands

- `ping [options] target_host`: Send ICMP echo requests to verify network reachability.
- `ifconfig` or `ip`: Inspect and configure network interfaces, IP addresses, MAC addresses, and link status.
- `netstat [options]`: Display active network sockets, listening ports, routing tables, and interface statistics.
- `ss [options]`: Faster and more modern replacement for `netstat`, retrieving socket statistics directly from kernel space.
- `nload`: Specialized terminal tool providing visual graphs of real-time incoming and outgoing network traffic. `nload` does not store historical trends and must be installed manually.
- `sudo hostnamectl set-hostname new_hostname`: Permanently update the system hostname across reboots. Changing hostname via `sudo hostname new_hostname` takes effect only temporarily until reboot.

### Miscellaneous Commands

- `sudo + command`: Execute a command with elevated superuser privileges.
- `grep [options] "pattern" file_path`: Search text for patterns matching regular expressions. E.g., `grep -i "error" /var/log/syslog` ignores case while searching for error lines; `ps -ef | grep "java"` locates Java processes.
- `kill -9 <PID>`: Send `SIGKILL` (-9) to forcefully terminate a process by PID.
- `shutdown`: `shutdown -h now` shuts down the machine immediately; `shutdown +5 "System will shutdown after 5 minutes"` schedules a shutdown in 5 minutes with a broadcast warning.
- `reboot`: Reboot the operating system. `reboot -w` records a simulation without actually rebooting.

## Linux Environment Variables

In Linux, environment variables define parameters of the system execution environment, such as a user's default home directory (`HOME`) or executable search paths (`PATH`).

### Classification of Environment Variables

By scope:

- User-level environment variables: Configured in `~/.bashrc`, `~/.bash_profile`.
- System-level environment variables: Configured in `/etc/bashrc`, `/etc/environment`, `/etc/profile`, `/etc/profile.d/`.

The configuration file loading order depends on whether the shell is a login shell, an interactive non-login shell, or a non-interactive shell. For Bash, a login shell typically reads `/etc/profile`, then the first readable file among `~/.bash_profile`, `~/.bash_login`, or `~/.profile`; an interactive non-login shell typically reads `~/.bashrc`. Many distributions source `~/.bashrc` inside `~/.bash_profile` by default, so actual loading behavior reflects distribution defaults.

Modifying system-level configuration files requires root or write privileges.

Best practice: configure user-level variables in `~/.bash_profile`, and configure system-level variables in `/etc/profile.d/*.sh`.

By lifecycle:

- Permanent: Variables declared in configuration files, loaded persistently across shell sessions.
- Temporary: Variables declared in the current terminal using `export`; they expire once the terminal session closes.

### Inspecting Environment Variables

The `export` command lists all exported environment variables in the current shell.

```bash
# List all currently exported environment variables
export -p
```

The `env` command also displays all environment variables.

Use `echo` to print the value of a specific variable.

```bash
# Print PATH environment variable
echo $PATH
# Print HOME environment variable
echo $HOME
```

### Modifying Environment Variables

Use `export` to modify environment variables in the current session. Changes take effect immediately, but vanish when the terminal closes.

```bash
export JAVA_HOME="/path/to/jdk"
export PATH="$JAVA_HOME/bin:$PATH"
```

To persist changes permanently, edit the profile configuration files with `vim`:

```bash
vim ~/.bash_profile
```

System-level modifications affect all users; user-level modifications apply only to the specific user.

After editing, apply updates immediately using `source`, or log out and log back in:

```bash
source ~/.bash_profile
```
