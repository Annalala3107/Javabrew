---
title: Practical GitHub Tips Summary
description: Summarizes high-efficiency tips for using GitHub, including profile pages, project badges, code reading, GitHub Actions, Explore/Trending, and open-source collaboration productivity techniques.
category: Developer Tools
tag:
  - Git
lang: en
sourceRef: zh-ref/tools/git/github-tips.md
head:
  - - meta
    - name: keywords
      content: GitHub Tips,Profile Page,README,Statistics,Open-Source Contribution,GitHub Actions,Code Reading
---

GitHub is much more than a code hosting platform. For developers, it simultaneously serves as a showcase for projects, a code-reading environment, a hub for open-source collaboration, an automation build platform, and a personal homepage. This article compiles a set of practical tips for getting more out of GitHub.

## One-Click GitHub Resume and GitHub Year-in-Review

Through the website [https://resume.github.io/](https://resume.github.io/), you can generate an online GitHub resume with a single click.

However, whether you should put your GitHub link on your resume depends on the quality of your account's content. If your account contains complete projects, consistent maintenance records, clear READMEs, and a relatively clean commit history, a GitHub link will add value; if it only has empty repositories or throwaway practice code, there is no need to force it onto your resume. The generated output looks like the screenshot below.

![GitHub Resume](/media/jg/ext/oss.javaguide.cn/2020-11/image-20201108192205620-a5a4105a.png)

Through <https://www.githubtrends.io/wrapped>, you can generate a GitHub personal annual report that lists your project contributions over the year, your most frequently used programming languages, and detailed contribution information.

## Personalize Your GitHub Profile Page

GitHub currently supports displaying custom content on your personal profile page. The result looks like the screenshot below.

![Personalized Profile Page Display](/media/jg/ext/oss.javaguide.cn/java-guide-blog/image-20210616221212259-50c2e8ba.png)

Achieving this is very simple: you just need to create a repository with the exact same name as your GitHub username, and then customize the contents of its `README.md`.

The custom content shown on your profile page is simply the contents of `README.md` (_for those who don't know Markdown syntax yet, go reflect in the corner for 5 minutes_).

![Create a repository with the same name as your GitHub account](/media/jg/ext/oss.javaguide.cn/java-guide-blog/image-20201107110309341-355239b7.png)

You can get quite creative with this! For example, using the open-source project [github-readme-stats](https://hellogithub.com/periodical/statistics/click/?target=https://github.com/anuraghazra/github-readme-stats), you can display dynamically generated GitHub statistics inside your README. The result looks like the screenshot below.

![Dynamically generate GitHub statistics with github-readme-stats](/media/jg/ext/oss.javaguide.cn/java-guide-blog/image-20210616221312426-cbbca19f.png)

We won't go into every detail of profile customization here—readers who are interested can explore more on their own.

## Custom Project Badges

The project badges you see on GitHub are generated through [https://shields.io/](https://shields.io/). Below are the badges used on my JavaGuide project.

![Project Badges](/media/jg/ext/oss.javaguide.cn/2020-11/image-20201107143136559-62170ad2.png)

Moreover, not only can you generate static badges, `shields.io` can also dynamically read your project's status and generate corresponding badges.

![Custom Project Badges](/media/jg/ext/oss.javaguide.cn/2020-11/image-20201107143502356-2f8b8313.png)

The generated badges describing project status look like the screenshot below.

![Badges Describing Project Status](/media/jg/ext/oss.javaguide.cn/2020-11/image-20201107143752642-fcfeaa4e.png)

## Automatically Add a Contribution Chart to Your Project

Using the tool `repobeats`, you can add a project contribution overview chart to your GitHub project.

Website: <https://repobeats.axiom.co/>.

## GitHub Emojis

![GitHub Emojis](/media/jg/ext/oss.javaguide.cn/2020-11/image-20201107162254582-46615280.png)

If you want to use emojis on GitHub, you can look them up here: [www.webfx.com/tools/emoji-cheat-sheet/](https://www.webfx.com/tools/emoji-cheat-sheet/).

![Online GitHub Emojis](/media/jg/ext/oss.javaguide.cn/2020-11/image-20201107162432941-fa620aab.png)

## Efficiently Reading Source Code of GitHub Projects

GitHub Codespaces provides an online VS Code-like development environment, making it suitable for quick code reading, debugging, or jumping into open-source contributions. For large projects or projects that require local service dependencies, it is still recommended to clone them locally and read and debug using your familiar IDE.

Below is a brief introduction to several commonly used ways to read GitHub project source code.

### Chrome Extension: Octotree

This is already a well-known classic and is my personal favorite approach. After installing Octotree, the browser sidebar displays the project in a tree structure, giving us an IDE-like experience for reading source code.

![Chrome Extension Octotree](/media/jg/ext/oss.javaguide.cn/2020-11/image-20201107144944798-0bf10917.png)

### Sourcegraph

When you don't want to clone a project locally, you can also use code search and reading tools like Sourcegraph. Sourcegraph supports cross-repository code search, reference navigation, and more, which is quite helpful when reading large projects.

Once you install this browser extension, an extra small icon will appear on the project homepage as shown below. Click this icon to read the project source code online.

![](/media/jg/ext/oss.javaguide.cn/2020-11/image-20201107145749659-5034715a.png)

Reading code with Sourcegraph looks similar to the screenshot below—it also displays code in a tree structure and supports jumping between classes.

![](/media/jg/ext/oss.javaguide.cn/2020-11/image-20201107150307314-f8d6db4f.png)

### Clone the Project Locally

Clone the project locally first, then use your favorite IDE to read it. If you want to deeply understand a project, this is the first-choice approach.

```bash
git clone https://github.com/Snailclimb/JavaGuide.git
```

## Extend GitHub's Features

**Enhanced GitHub** makes your GitHub experience even better. This browser extension displays repository size and file sizes, and supports quickly downloading individual files.

![](/media/jg/ext/oss.javaguide.cn/2020-11/image-20201107160817672-8db933ee.png)

## Automatically Generate a Table of Contents for Markdown Files

If you want to generate a table of contents for a Markdown file, VS Code extensions such as **Markdown Preview Enhanced** can easily do the job.

The generated table of contents looks like the screenshot below. You can click directly on links in the table of contents to jump to the corresponding section of the document, improving the reading experience.

![](/media/jg/ext/oss.javaguide.cn/2020-11/iShot2020-11-07-16.14.14-1--d677ca02.png)

However, GitHub now automatically generates a table of contents for Markdown files as well—you just need to expand it via the table-of-contents button on the page.

## Make Good Use of GitHub Explore

GitHub's built-in Explore feature is a very powerful and useful tool for discovering projects, topics, and technology trends.

Simply put, GitHub Explore provides the following features:

1. It recommends projects to you based on your personal interests;
2. GitHub Topics categorizes and aggregates projects by category/topic. For example, [Data visualization](https://github.com/topics/data-visualization) compiles open-source projects related to data visualization, and [Awesome Lists](https://github.com/topics/awesome) gathers Awesome-series repositories;
3. Through GitHub Trending, we can see popular open-source projects recently gaining traction, and filter projects by programming language and time window;
4. GitHub Collections acts like a curated bookmark collection. For example, [Teaching materials for computational social science](https://github.com/collections/teaching-computational-social-science) compiles open-source resources related to computer science courses, while [Learn to Code](https://github.com/collections/learn-to-code) gathers repositories helpful for learning programming;
5. ...

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/github-explore-cce0f1aa.png)

## GitHub Actions Is Very Powerful

You can simply think of GitHub Actions as GitHub's built-in automation platform. With GitHub Actions, you can run builds, tests, deployments, dependency scanning, scheduled jobs, and more directly on GitHub.

For a detailed introduction to GitHub Actions, it is recommended to read the [GitHub Actions Tutorial](https://www.ruanyifeng.com/blog/2019/09/getting-started-with-github-actions.html) written by Ruan Yifeng.

GitHub Actions has an official Marketplace featuring many community-submitted Actions that you can reuse directly.

![](/media/jg/ext/oss.javaguide.cn/github/javaguide/image-20211227100147433-5efe5259.png)

## Afterword

You don't need to memorize every GitHub tip all at once. Putting profile customization, project badges, code reading tools, Explore/Trending, and GitHub Actions into practice first is already enough to cover most everyday scenarios.

In addition, this article did not dive into GitHub search syntax. In real-world usage, keyword search, language filtering, sorting by stars, and filtering by update time are often much more practical than memorizing complex query syntax.
