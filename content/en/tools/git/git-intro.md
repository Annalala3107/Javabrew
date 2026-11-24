---
title: Git Core Concepts Summary
description: Summarizes Git's core concepts and workflows, covering branching and merging, commit management, and conflict resolution to improve team collaboration and code quality.
category: Developer Tools
tag:
  - Git
lang: en
sourceRef: zh-ref/tools/git/git-intro.md
head:
  - - meta
    - name: keywords
      content: Git,Version Control,Distributed,Branch,Commit,Merge,Conflict Resolution,Workflow
---

## Version Control

### What Is Version Control

Version control is a system that records changes to a file or set of files over time so that you can recall specific versions later. Besides project source code, you can place nearly any type of file under version control.

### Why Use Version Control

With version control, you can revert selected files back to a previous state, revert the entire project back to a past point in time, compare changes over time, see who last modified something that might be causing a bizarre issue, who introduced an issue and when, and so on.

### Local Version Control Systems

Many people's version-control method of choice is to copy files into another directory, perhaps renaming it with a timestamp to tell them apart. This approach is very common because it is so simple, but it is also incredibly error prone. It is easy to forget which directory you are in and accidentally write to the wrong file or overwrite files you didn't mean to.

To deal with this issue, programmers long ago developed local version control systems that had a simple database keeping all the changes to files under revision control.

![Local Version Control System](/media/jg/ext/oss.javaguide.cn/javaguide/tools/git/.png-2300cd9c.png)

### Centralized Version Control Systems

The next major issue people encountered was how to let developers working on different systems collaborate. To solve this problem, Centralized Version Control Systems (CVCS) were created.

Centralized Version Control Systems have a single server that contains all the versioned files, and a number of clients that check out files from that central place or commit updates to it.

![Centralized Version Control System](/media/jg/ext/oss.javaguide.cn/javaguide/tools/git/.png-a7825939.png)

Although this solves the drawback of local version control systems being unable to support collaboration across different machines, it still has the following disadvantages:

- **Single Point of Failure:** If that central server goes down, nobody can collaborate or save versioned changes. If the hard disk the central database is on becomes corrupted and proper backups haven't been kept, you lose absolutely everything. Local version control systems suffer from this same problem: whenever you have the entire history of the project in a single place, you risk losing everything.
- **Network Connection Required:** Developers must be connected to the network to work, so efficiency is affected by network conditions and bandwidth.

### Distributed Version Control Systems

This is where Distributed Version Control Systems (DVCS) come in. Git is a classic example of a distributed version control system.

In these systems, clients don't just check out the latest snapshot of the files; rather, they fully mirror the repository. Thus, if any server dies and these systems were collaborating via that server, any of the client repositories can be copied back up to the server to restore it. Every clone is really a full backup of all the data.

![Distributed Version Control System](/media/jg/ext/oss.javaguide.cn/javaguide/tools/git/.png-35b4df98.png)

Distributed version control systems allow you to work offline because every developer's computer holds a complete repository. Once you modify a file, you can simply push your changes to others. However, in real-world practice with distributed version control systems, people rarely push changes directly to one another; instead, they use a machine acting as a "central server." This server merely exists to make exchanging changes among teammates more convenient—without it, everyone can still get their work done, though exchanging changes would be less convenient.

The advantages of distributed version control systems go far beyond working offline; later we will also see Git's remarkably powerful features such as branch management.

## Getting to Know Git

### A Brief History of Git

The Linux kernel project previously used a proprietary distributed version control system called BitKeeper to manage and maintain its code. Later, however, the relationship between the Linux kernel open-source community and the commercial company that developed BitKeeper broke down, and the tool's free-of-charge status was revoked. Drawing on lessons learned from using BitKeeper, the Linux open-source community (and in particular Linus Torvalds, the creator of Linux) developed their own version control system with substantial improvements over the old one.

### Key Differences Between Git and Other Version Control Systems

The way Git stores and thinks about information is quite different from other version control systems, even though the user interface commands look fairly similar. Understanding these differences will help keep you from getting confused when using Git.

Below, we focus on one major difference between Git and other version control systems: **the way it thinks about its data**.

**Git records snapshots directly rather than storing file diffs. I will explain the difference between these two approaches in detail below.**

Most other version control systems (CVS, Subversion, Perforce, Bazaar, and so on) store information as a list of file-based changes. These systems **think of the information they store as a set of files and the changes made to each file over time**.

The specific principle is shown in the figure below. It is actually easy to understand: each time we commit an update to a file, the system records what updates were made to that file, represented by the delta symbol Δ (Delta).

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/git/2019-3deltas-21153b9f.png)

**How do we obtain the final version of a file?**

It's simple—just basic high school math: we simply sum up the original base file and all of these incremental changes.

**What is the problem with this approach?**

For example, if there are an enormous number of deltas, constructing the final file will consume significant time and performance.

Git doesn't think of or store its data this way. Instead, Git thinks of its data more like a set of snapshots of a miniature filesystem. Every time you commit, or save the state of your project in Git, it basically takes a picture of what all your files look like at that moment and stores a reference to that snapshot. To be efficient, if files have not changed, Git doesn't store the file again—just a link to the previous identical file it has already stored. Git thinks about its data more like a **stream of snapshots**.

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/git/2019-3snapshots-74465a70.png)

### The Three States of Git

Git has three main states that your files can reside in:

1. **Committed**: The data is safely stored in your local database.
2. **Modified**: You have changed the file, but have not committed it to your database yet.
3. **Staged**: You have marked a modified file in its current version to go into your next commit snapshot.

This leads us to the three main sections of a Git project: the **Git directory (`.git` directory)**, the **Working Directory**, and the **Staging Area**.

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/git/2019-3areas-2e18b4f5.png)

**The basic Git workflow goes something like this:**

1. You modify files in your working directory.
2. You selectively stage just those changes you want to be part of your next commit, which adds only those changes to the staging area.
3. You do a commit, which takes the files as they are in the staging area and stores that snapshot permanently to your Git directory.

## Quick Start Guide to Using Git

### Getting a Git Repository

There are two main ways to obtain a Git repository:

1. Initialize a repository in an existing directory: navigate into the project directory and run `git init`, which creates a subdirectory named `.git`.
2. Clone an existing Git repository from a server: `git clone [url]`. If you want to customize the local directory name, you can run `git clone [url] directoryname`.

### Recording Changes to the Repository

1. **Check the current status of files**: `git status`
2. **Stage changes (add them to the staging area)**: `git add filename` (for a specific file), `git add .` (all changes in the current directory), `git add *.txt` (supports wildcards, all `.txt` files).
3. **Ignore files**: `.gitignore` file.
4. **Commit updates**: `git commit -m "commit message"`. Before committing, always run `git status` to verify that everything intended is staged.
5. **Skip the staging area when committing**: `git commit -a -m "commit message"`. Adding the `-a` option to `git commit` makes Git automatically stage every file that is already tracked before doing the commit, letting you skip the `git add` step.
6. **Remove files**: `git rm filename` (removes the file from the staging area, then you commit).
7. **Rename files**: `git mv README.md README` (this single command is equivalent to running the three commands `mv README.md README`, `git rm README.md`, and `git add README`).

### Writing a Good Git Commit Message

A good Git commit message looks like this:

```plain
Subject line: use this single line to describe and explain your commit

The body can be a few short lines that add more detail to explain the commit, ideally providing some relevant background or explaining what problem this commit fixes and resolves.

The body can of course have multiple paragraphs, but make sure to wrap lines properly and keep sentences from getting too long, because that makes indentation look much cleaner when running "git log".
```

The subject line description of a commit should be as clear as possible and ideally summarize the change in one sentence. This makes it easy to display in Git log viewers and easy for other people to read.

### Pushing Changes to a Remote Repository

- If you have not cloned an existing repository and want to connect your local repository to a remote server, you can add it with `git remote add origin <server>`. For instance, to link your local repository to a repository created on GitHub, you can write: `git remote add origin https://github.com/Snailclimb/test.git`.
- Push these changes to the remote repository: `git push origin main`. Here `main` can be replaced with any branch you wish to push. Many older projects still use `master` as their default branch—check the actual repository to be sure.

  In this way, you can push your changes to the added server.

### Removing and Renaming Remotes

- Rename `test` to `test1`: `git remote rename test test1`
- Remove the remote repository `test1`: `git remote rm test1`

### Viewing Commit History

After you have made several commits, or if you have cloned a repository with an existing commit history, you will probably want to look back to see what has happened. The most basic and powerful tool to do this is the `git log` command. By default, `git log` lists the commits made in that repository in reverse chronological order—the most recent commits show up first.

**You can add flags to inspect only the entries you want to see:**

View commits from a specific author only:

```shell
git log --author=bob
```

### Undoing Things

Sometimes we commit too early and realize we forgot to add a couple of files, or we messed up our commit message. If you want to try that commit again, you can run commit with the `--amend` option:

```shell
git commit --amend
```

Unstage a staged file:

```shell
git restore --staged filename
```

In older versions of Git, the following syntax is also commonly seen:

```shell
git reset filename
```

Discard modifications to a file in the working directory:

```shell
git restore filename
```

In older versions of Git, the following syntax is also commonly seen:

```shell
git checkout -- filename
```

If you want to drop all your local changes and commits, you can fetch the latest history from the server and point your local main branch at it:

```shell
git fetch origin
git reset --hard origin/main
```

Note: `git reset --hard` discards uncommitted local changes, so make sure nothing you want to keep will be lost before running it. For older projects whose default branch is `master`, change the command accordingly to `git reset --hard origin/master`.

### Branches

Branches are used to isolate different development tasks from one another. You can develop features or fix bugs on separate branches and merge them back into the main branch once finished. Nowadays many repositories name their default branch `main`, while `master` is also frequently seen in older projects.

We usually create a branch when developing a new feature, fixing an urgent bug, and so on. Whether single-branch or multi-branch development is better depends on the specific scenario.

Create a branch named `test`:

```shell
git branch test
```

Switch the current branch to `test` (when you switch branches, Git resets your working directory to look like it did the last time you committed on that branch. It adds, removes, and modifies files automatically to make sure your working copy is what the branch looked like on your last commit to it):

```shell
git switch test
```

In older versions of Git, `git checkout test` is also commonly seen.

![](/media/jg/ext/oss.javaguide.cn/javaguide/tools/git/2019-3-16e02f90.png)

You can also create a new branch and switch to it in one command:

```shell
git switch -c feature_x
```

In older versions of Git, `git checkout -b feature_x` is also commonly seen.

Switch back to the main branch:

```shell
git switch main
```

Merge a branch (conflicts may occur):

```shell
git merge test
```

Delete the newly created branch:

```shell
git branch -d feature_x
```

Push a branch to the remote repository (making it visible to others after a successful push):

```shell
git push origin feature_x
```

## Recommended Learning Resources

**Interactive Online Learning Tool:**

(Supplement from [issue729](https://github.com/Snailclimb/JavaGuide/issues/729)) Learn Git Branching <https://oschina.gitee.io/learn-git-branching/>. This website conveniently demonstrates basic Git operations and clearly explains the effect and outcome of each fundamental command.

**Recommended Reading:**

- [Illustrated Git Beginner Tutorial (15,000 Words, 40 Diagrams)](https://www.cnblogs.com/anding/p/16987769.html): A very thoughtfully crafted article with comprehensive content and detailed diagrams—strongly recommended!
- [git - the simple guide](https://rogerdudler.github.io/git-guide/index.zh.html): Covers common Git operations and is very clear.
- [A Visual Git Reference](https://marklodato.github.io/visual-git-guide/index-zh-cn.html): Illustrates the most commonly used Git commands visually. If you have a slight understanding of how Git works, this article will help you understand it much more thoroughly.
- [Git Tutorial Even a Monkey Can Understand](https://backlog.com/git-tutorial/cn/intro/intro1_1.html): An engaging and fun explanation.
- [Pro Git book](https://git-scm.com/book/zh/v2): A well-known Git book translated into many languages with very high quality.
