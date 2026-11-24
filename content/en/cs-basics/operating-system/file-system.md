---
title: "Deep Dive into Operating System File Systems: inode, VFS, Page Cache, and Journaling"
description: "A comprehensive summary of high-frequency file system interview questions, starting from files and directories to dissecting inodes, dentries, file descriptors, VFS, disk block allocation, free space management, hard and symbolic links, Page Cache, fsync, and journaling file systems."
category: Computer Science Fundamentals
tag:
  - Operating System
  - Linux
head:
  - - meta
    - name: keywords
      content: File System,Operating System File System,File System Interview Questions,Linux File System,inode,dentry,VFS,File Descriptor,Hard Link,Symbolic Link,Page Cache,fsync,ext4,Journaling File System,OS Interview Questions
lang: en
sourceRef: zh-ref/cs-basics/operating-system/file-system.md
---

When writing an endpoint to save a file, the most intuitive implementation is straightforward: resolve the file path, call `open()` to acquire a descriptor, stream data via `write()`, and finally invoke `close()`. When file volumes are small, concurrency is low, and hardware operates without failure, this workflow appears simple.

Yet during technical interviews, deep-dive questions quickly emerge: *What does the file descriptor returned by `open()` actually point to?*, *Is the filename stored inside the inode?*, *Why do two hard links see the exact same file content?*, *When `write()` returns successfully, is data genuinely persisted to disk?*, and *Why does `df -h` still report 100% disk usage after deleting a massive log file?*

Answering these questions requires peering into the file system. It must translate string paths into kernel file objects, map the $N$-th byte of a file to physical storage blocks, and manage access permissions, caching, deletion semantics, file renaming, and crash recovery.

The answers lie within inodes, dentries, the VFS, the Page Cache, and journaling mechanisms.

Let us begin with the most fundamental question: what does a file system actually manage?

## What Does a File System Actually Manage?

In everyday software development, we interact with paths, filenames, directories, `read()`, and `write()`. For a file system built on top of a local block device, the underlying reality consists of logical blocks, disk sectors, and device I/O; the file system organizes these low-level physical resources into structured files, directories, and metadata.

However, not all file systems correspond to local physical disks. `tmpfs` uses RAM as its backing storage, `procfs` exposes real-time kernel operating state as synthetic files, and NFS links a remote network file system into the local directory tree. The Virtual File System (VFS) abstracts across all these implementations to provide a unified, uniform file interface.

I suggest viewing the file system as solving 4 fundamental responsibilities simultaneously:

![Overview of File System Responsibilities](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/file-system-responsibilities-e613f01c.webp)

- **Naming**: Resolving a path and filename to target an intended file, such as `/var/log/app.log`.
- **Organization**: Structuring files into a hierarchical directory tree so different files can be categorized under distinct folders.
- **Locating**: Mapping the $N$-th byte of a file to a specific physical data block on an HDD or SSD.
- **Protection**: Enforcing permissions, user ownership, and access timestamps, validating access rights on every operation.

Without a file system, applications would be forced to manually track *"which raw disk blocks belong to which file"*, while writing custom routines for file growth, deletion, permissions, and crash recovery. The file system encapsulates this complexity behind a unified interface, allowing applications to read and write simply by manipulating file descriptors.

This article focuses primarily on Linux/Unix-style file systems. While implementations vary across NTFS, APFS, Btrfs, XFS, and ext4, the foundational challenges of files, directories, metadata, caching, allocation, and recovery remain universal.

## What Are Files and Directories?

In Unix/Linux terminology, a regular file can be understood as an ordered sequence of bytes accompanied by a name and metadata, typically persisted on non-volatile storage. The VFS also exposes directories, hardware devices, FIFOs, UNIX domain sockets, and pseudo-filesystems through the identical file interface.

Hence, the famous aphorism **"everything is a file"** is more accurately understood as: Linux strives to expose diverse system resources through file descriptors and a unified I/O interface, rather than implying that every object physically persists to disk. A Unix pipe stores its data in ephemeral kernel memory buffers, while files under `/proc` are dynamically generated in real time by kernel functions.

A directory is also fundamentally a file, albeit with special contents. In Unix-style file systems like ext4, a directory's data primarily consists of a mapping table of **"filename to inode number"**. When a user locates a file via an absolute path, the file system traverses directory structures hierarchically:

```text
/home/guide/a.txt
  -> Query root directory /
  -> Locate home
  -> Enter home, locate guide
  -> Enter guide, locate a.txt
```

The directory tree gives files hierarchical structure. The mounting mechanism attaches multiple disparate file systems onto a single unified directory tree. For instance, after mounting partition `/dev/sda2` to `/data`, accessing `/data/app.log` transparently routes operations to the file system hosted on that specific disk partition.

Although a directory possesses its own inode and data blocks internally, user-space applications cannot read directory contents via raw `read()` calls; they must traverse directory entries via specialized interfaces such as `readdir()` or `getdents()`.

## What Is the Relationship Between inode, dentry, and Filename?

In Linux/Unix file systems, mastering the **inode** is paramount.

**An inode (index node) stores file metadata.** Common attributes include file type, access permissions, owner UID/GID, byte size, timestamps (atime, mtime, ctime), link count, and pointers targeting the underlying physical data blocks.

Crucially, **an inode does not store the filename**. The filename belongs strictly to directory entries; multiple filenames can point to the exact same inode. Furthermore, regular file data resides in independent data blocks or extents, while the inode stores only the mapping structures. However, certain file systems implement inline data optimizations; for example, ext4 can store tiny file payloads or short symlink targets directly within unused space inside the inode itself.

Linux VFS also maintains **dentries** in memory. A dentry (directory entry) represents a path component, functioning as a high-speed in-memory lookup cache; it typically points to an inode, though it can also represent a non-existent path as a "negative dentry." The structural division can be summarized as:

- **Filename**: Persisted inside disk directory entries.
- **dentry**: Maintained in memory by the VFS as a path component resolution and lookup cache.
- **inode**: Represents the file system object, maintaining metadata and block mapping pointers.
- **Data Blocks / Extents**: Store the actual payload bytes of regular files.

This explains why renaming a file is virtually instantaneous. When executing `mv a.txt b.txt` within the same file system, the kernel simply modifies the name mapping inside the directory entry; the file's data blocks and inode remain untouched.

![Relationship Between Filename, dentry, and inode](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/file-inode-dentry-relation-9ed196c7.webp)

You can inspect these structures using standard Linux utilities:

```bash
# Inspect the inode number
ls -li app.log

# Inspect detailed file metadata
stat app.log

# Inspect file system inode utilization
df -i
```

On file systems like ext4 that allocate a fixed inode table during formatting, inodes can be exhausted before data blocks run out. A server might show abundant free gigabytes via `df -h`, yet creating a new file fails with `No space left on device` because millions of tiny files have consumed all available inodes (`df -i`). Because inode allocation strategies vary across modern file systems, interpreting `df -i` must take the specific file system implementation into account.

## What Happens When You `open` a File?

When an application invokes `open()`, the kernel does not load the entire file into memory. Instead, it performs the following steps:

1. Resolves the path, traversing dentries to find the target directory entry and its associated inode.
2. Verifies access permissions, open flags, and file types.
3. Instantiates an in-kernel **open file description** (struct `file`), recording the current file offset, access mode, and status flags.
4. Allocates the lowest available non-negative integer in the current process's file descriptor table, returning this number as the **fd**.

Linux man-pages specify this separation clearly: `open()` returns an index into the process-private file descriptor table; each successful `open()` instantiates a system-wide open file description tracking the file offset and flags.

These structures are frequently conflated:

![From Path to File Descriptor](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/file-path-to-fd-2e2e40b2.webp)

| Structure | Scope | Primary Contents |
| --- | --- | --- |
| **File Descriptor Table** | Per-process | Maps an integer fd to an open file description |
| **Open File Description (`file`)** | System-wide | Current read/write byte offset, file status flags, access modes |
| **inode Table / Cache** | Kernel & File System | File metadata, physical data block / extent pointers |

Following a `dup()` or `fork()`, multiple file descriptors can reference the exact same open file description, meaning they share the identical file read/write offset. Conversely, two distinct processes opening the identical file via separate `open()` calls obtain distinct open file descriptions, each maintaining its own independent byte offset.

This architecture explains a notorious operational phenomenon: **when an active file is unlinked, a running process holding an open fd can continue writing to it undisturbed.** The `unlink()` system call merely removes the name mapping from the directory and decrements the inode's link count. Only when the inode's link count drops to zero AND all active open file descriptions and memory mappings across the entire system are closed does the operating system finally release the physical disk blocks.

## How Are Files Laid Out on Disk?

Disks and SSDs read and write data in uniform blocks. A file system formats a disk partition or storage volume into fixed-size blocks, managing them through metadata structures. Taking the classic ext family as an example, on-disk layouts typically partition storage into:

- **Superblock**: Records global file system parameters, such as block size, total inodes, free block counts, and mount status.
- **inode Area**: Stores the table of inodes.
- **Data Block Area**: Stores file content payloads and directory entry blocks.
- **Bitmaps and Free Space Structures**: Tracks which inodes and data blocks are currently allocated or free.

Textbooks classicize file block allocation into contiguous, linked, and indexed schemes. They offer an excellent framework for understanding engineering trade-offs:

**Contiguous Allocation** stores a file across a contiguous sequence of physical disk blocks. The advantage is that both sequential and random access are trivial to compute: knowing the starting block and length resolves any byte. The downside is severe: growing files dynamically is difficult, and repeated allocations and deletions cause severe external fragmentation.

**Linked Allocation** scatters file blocks across arbitrary free disk locations, with each block holding a pointer to the next block. It handles dynamic file growth gracefully without external fragmentation, but random access performance is abysmal. To read block 1000, the system must traverse pointers across the preceding 999 blocks sequentially. The FAT (File Allocation Table) architecture centralized these pointers into an in-memory table to improve lookup performance, though the table itself becomes metadata overhead that scales with partition size.

**Indexed Allocation** brings all block pointers together into dedicated index blocks. To read block $i$, the kernel queries the $i$-th entry of the index block and jumps directly to that data block. It supports fast random access without external fragmentation, at the cost of dedicating disk space to index blocks.

Classic ext2 and ext3 utilized a multi-tier index block layout: direct block pointers, single indirect, double indirect, and triple indirect blocks. Modern ext4 replaced this layout with an **extent tree**: a single extent records the logical start block, physical start block, and length of a contiguous block run. For large contiguous files, extents save massive amounts of mapping metadata compared to recording every single block address individually.

![File Data Block Allocation Strategies](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/file-block-allocation-19a7c361.webp)

Other modern file systems employ different combinations—such as B-trees, extents, delayed allocation, and copy-on-write (COW). Do not assume the classic direct/indirect pointer structure represents the universal layout of all modern file systems.

## How Is Free Space Managed?

When a file is deleted, its data blocks must be returned to the file system; when a new file writes data, available free blocks must be located rapidly. This is free space management.

Common strategies include:

- **Free Space Tables**: Record the starting block and length of contiguous free extents. Well-suited for contiguous allocation, but the table becomes complex as fragmentation mounts.
- **Free Lists**: Link all free blocks into a linked list. Allocating and freeing individual blocks is straightforward, but locating large contiguous runs is cumbersome.
- **Bitmaps (Bit Vectors)**: Each physical block is represented by a single bit: 0 indicates free, 1 indicates in use. Finding contiguous free blocks involves fast CPU bitwise scanning, and memory overhead is modest.
- **Group Linking**: Stores lists of free block addresses inside designated free blocks, linking to subsequent blocks; historically common in early Unix.

Bitmaps are ubiquitous. Consider a 1 TiB file system with 4 KiB blocks: it contains $2^{28}$ blocks. Representing each block with 1 bit requires $2^{28}\text{ bits} = 32\text{ MiB}$ of bitmap space. This modest memory footprint provides unambiguous, high-speed block tracking.

Production file systems pair bitmaps with locality-aware allocation policies. For example, they attempt to allocate files in the same directory, or contiguous extents of a large file, physically close to one another on disk to optimize sequential I/O. While SSDs do not suffer from mechanical seek latencies, sequential writes, write amplification, erase block boundaries, and TRIM commands still heavily impact solid-state drive performance and endurance.

## What Problem Does the VFS Solve?

Linux supports dozens of file systems: ext4, XFS, Btrfs, tmpfs, procfs, NFS, and more. User-space programs cannot be expected to implement custom calls like `open_ext4()` or `open_xfs()`.

The **Virtual File System (VFS)** acts as the unifying abstraction layer. Applications invoke standard POSIX system calls—`open`, `read`, `write`, `close`—and the VFS dynamically dispatches these calls to the concrete file system driver hosting the targeted file.

Official Linux kernel VFS documentation defines four primary abstractions:

- **superblock**: Represents a mounted file system instance.
- **inode**: Represents an individual file system object (regular file, directory, FIFO, etc.).
- **dentry**: Represents an individual path component, caching name resolution.
- **file**: Represents an open file description instantiated when an application opens a file (backing an active fd).

Thanks to the VFS, running `cat /proc/cpuinfo`, `cat /var/log/app.log`, or reading files mounted over NFS all use identical user-space semantics. All concrete divergence is cleanly contained beneath the VFS abstraction boundary.

## What Is the Difference Between Hard Links and Symbolic Links?

Both hard links and symbolic links (symlinks) associate a path with an underlying file, but they point to fundamentally different targets.

| Comparison | Hard Link | Symbolic Link (Soft Link) |
| --- | --- | --- |
| **Points To** | The identical `inode` | Another target file path |
| **Creates New inode?** | No new file inode; creates a directory entry and increments link count | Yes; a symlink is an independent file with its own unique inode |
| **After Source Deletion** | Content remains intact as long as any hard link exists | Becomes a dangling (broken) link |
| **Cross-Filesystem?** | No | Yes |
| **Can Link Directories?** | Disallowed for ordinary users in Linux | Yes |

![Comparison Between Hard Links and Symbolic Links](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/file-hardlink-symlink-0dd2c4bf.webp)

Hard links cannot span across different file systems because an inode number is meaningful strictly within its own file system partition. Another file system maintains its own separate inode table, meaning the exact same numerical inode ID represents an entirely different file.

You can verify this with a simple terminal experiment:

```bash
echo hello > a.txt
ln a.txt hard.txt
ln -s a.txt soft.txt

ls -li a.txt hard.txt soft.txt
```

You will observe that `a.txt` and `hard.txt` share the exact same inode number, whereas `soft.txt` possesses a distinct inode number. If you delete `a.txt`, reading `hard.txt` continues to return "hello", while `soft.txt` points to a non-existent path.

## Why Does the Page Cache Dominate File I/O Performance?

Accessing physical disk storage directly is orders of magnitude too slow. Linux leverages the **Page Cache** to cache file data in physical RAM.

When reading a file, if the requested page is already resident in the Page Cache, the kernel copies the data directly from RAM to user space without touching the disk. Only upon a cache miss does the kernel issue disk I/O to fetch the page into the Page Cache before returning.

For standard buffered I/O, a successful return from `write()` merely signifies that data was accepted by the kernel—typically meaning it landed in the Page Cache and was tagged as a **dirty page**. It guarantees neither that the full requested byte count was written nor that data has been physically persisted to underlying hardware. Callers must handle partial writes, and if durability is required, callers must explicitly verify errors from `fsync()`, `fdatasync()`, and `close()`.

`fdatasync()` flushes dirty file data pages, but synchronizes only metadata strictly necessary for future data reads (such as file size); `fsync()` flushes both file data and all associated metadata (such as timestamps). Note that this applies to standard buffered I/O; flags like `O_DIRECT`, `O_SYNC`, and DAX modify these behaviors.

The operational trade-off is crash vulnerability. If an operating system loses power shortly after a buffered `write()` returns, data remaining in the Page Cache is lost. When strong persistence guarantees are mandatory, applications must invoke `fsync()`, `fdatasync()`, or open files with synchronous flags. However, forcing synchronous disk writes causes threads to stall on disk write queues, severely dropping throughput.

A vital engineering nuance frequently overlooked: **`fsync(fileFd)` synchronizes only the file itself—it does not synchronize directory entry changes in the parent directory.** After creating a new file, calling `rename()`, or invoking `unlink()`, if you require power-loss durability for the directory entry itself, you must explicitly `open()` the parent directory and invoke `fsync()` on the parent directory's fd.

A canonical safe file overwrite workflow follows these steps: create a temporary file in the same directory, write the complete payload, call `fsync()` on the temporary file, atomically replace the target file via `rename()`, and finally invoke `fsync()` on the parent directory descriptor. While `rename()` guarantees atomic replacement in the directory namespace on POSIX systems, "namespace atomicity" does not guarantee "durability across power failure" without syncing the parent directory.

Databases, message brokers, and write-ahead logs navigate this trade-off constantly: some configurations force every transaction commit to fsync immediately, while others accept a bounded window of data loss in exchange for massive throughput.

![File Write to Persistence Path](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/operating-system/file-write-persistence-edfe5461.webp)

## How Do Journaling File Systems Prevent Crash Corruption?

A file system's greatest hazard is crashing mid-write. For example, creating a file requires allocating an inode, allocating data blocks, updating directory entries, and modifying allocation bitmaps. If power fails halfway through, the file system can be left in a corrupted, inconsistent state.

A **Journaling File System** solves this by writing pending metadata modifications to a dedicated journal area first, before committing updates to their permanent on-disk locations. During crash recovery at boot, the file system replays committed transactions from the journal whose formal writes were incomplete; transactions lacking commit records or failing checksums are discarded. Journaling guarantees that file system structural integrity is never left half-updated.

Taking ext4 as an example, official documentation outlines 3 distinct journaling modes:

- **`data=writeback`**: Journals metadata updates only, without guaranteeing that data blocks are written before metadata commits. It delivers highest throughput, but recent writes can expose stale or garbage data after a crash.
- **`data=ordered`**: The default mode. Metadata is journaled, but all associated file data blocks are forced to disk before the metadata transaction commits to the journal. It avoids journaling file payloads directly while eliminating the risk of metadata pointing to unwritten data blocks.
- **`data=journal`**: Both metadata and file payloads are committed to the journal before writing to formal storage. It provides the strongest crash consistency guarantees, at the cost of double-write amplification and reduced performance.

Journaling protects **file system structural consistency**; it does not absolve applications from managing business data durability. Achieving transaction-level persistence still requires proper application use of `fsync()`, temporary files, and parent directory synchronization.

## Where to Look When Troubleshooting File System Performance

When diagnosing storage performance anomalies in production, do not look solely at disk capacity. Monitor these key operational metrics:

**Inode Exhaustion**:

```bash
df -i
```

Accumulating millions of tiny files can exhaust available inodes long before storage capacity is reached.

**File Descriptor Leaks**:

```bash
ulimit -n
cat /proc/<pid>/limits
lsof -p <pid>
ls /proc/<pid>/fd | wc -l
```

When an application throws `Too many open files`, distinguish between two errors: `EMFILE` indicates the current process has hit its per-process fd limit; `ENFILE` indicates the system-wide open file table limit is exhausted.

In multi-threaded applications, always prefer atomic close-on-exec flags like `O_CLOEXEC` when creating descriptors to prevent fds from leaking across `exec()` into child processes.

**Page Cache Size and Memory Pressure**:

```bash
free -h
vmstat 1
```

`free -h` and `vmstat 1` provide visibility into cache sizes, swap activity, and I/O wait. Remember that Linux aggressively uses idle memory for caching, so a large `buff/cache` figure is healthy. What matters is whether applications are stalling on I/O, whether background writeback is surging, or whether memory pressure is forcing violent cache reclamation.

To inspect per-file Page Cache residency, newer Linux kernels provide `cachestat()`, or you can leverage eBPF-based `cachestat` tools (evaluating tracing overhead prior to production use).

**Disk Saturation**:

```bash
iostat -x 1
```

On legacy rotational disks, a `%util` close to 100% signaled a saturated device. On modern NVMe SSDs, RAID arrays, and distributed block storage capable of executing dozens of I/O queues in parallel, `%util` is no longer a reliable saturation metric. Always evaluate `await`, `r_await`, `w_await`, `aqu-sz` (queue size), IOPS, and application-level latency in concert.

**`df` Shows 100% Full, but `du` Cannot Find Large Files**:

```bash
lsof +L1
ls -l /proc/<pid>/fd
```

`du` traverses directory trees counting files that still hold names; `df` queries block allocation directly from the file system superblock. If a massive log file was deleted via `rm` (issuing `unlink`) while a running process keeps its descriptor open, the file vanishes from directory listings (`du` cannot see it), but its physical disk blocks cannot be freed (`df` remains full). The resolution is signaling the process to reopen its log file or restarting the service; never blindly truncate or delete `/proc/<pid>/fd/*` entries directly.

A final operational note: different file systems, kernel releases, mount options, and hardware controller caches dramatically influence real-world behavior. For example, `O_DIRECT` alignment constraints vary across kernel versions and file system types. Always validate storage tuning decisions against production kernel configs, `mount` parameters, and benchmark tools like `fio`.

## How to Answer File System Questions in an Interview

If asked *"What is a file system?"*, structure your answer around the 4 core responsibilities:

A file system organizes raw storage blocks into human-readable files and directories. It is responsible for naming, hierarchical organization, block locating, free space management, access protection, caching, and crash recovery.

When discussing Linux, break down the core VFS abstractions: superblock, inode, dentry, and file. Explain that filenames reside inside directory entries; inodes hold metadata and block/extent pointers; `open()` resolves paths to return a process-private fd pointing to an open file description; and operations route transparently through the VFS to concrete drivers.

If probed on **hard links vs. soft links**, summarize cleanly: hard links are multiple directory entries pointing to the identical inode (sharing metadata and blocks), while soft links are independent files storing a target path string.

If asked **why data can be lost after writing to a file**, explain the Page Cache and buffered writeback: `write()` returns as soon as data enters the kernel Page Cache as dirty pages. Guaranteeing durability across power loss requires explicit `fsync()` / `fdatasync()` calls, proper parent directory synchronization, and understanding journaling modes.
