---
title: "Trie (Prefix Tree) Interview Questions Summary: Principles, Prefix Matching, and Java Implementation"
description: Trie prefix tree interview question summary explaining dictionary tree node structure, insertion, search, prefix matching, complexity, search suggestions, sensitive word filtering, and high-frequency LeetCode questions.
category: CS Basics
tag:
  - Data Structures
head:
  - - meta
    - name: keywords
      content: Trie,prefix tree,dictionary tree,prefix matching,string algorithms,search suggestions,sensitive word filtering,Java Trie,LeetCode Trie,data structure interview questions
lang: en
sourceRef: zh-ref/cs-basics/data-structure/trie.md
---

# Trie (Prefix Tree) Interview Questions Summary: Principles, Prefix Matching, and Java Implementation

A Trie (pronounced "try"), also known as a prefix tree or dictionary tree, is a specialized tree structure ideally suited for handling prefix matching problems over massive collections of strings. Search autocomplete, dictionary lookups, sensitive word filtering, and routing prefix matching all heavily rely on Trie-based architectures.

Its core intuition is straightforward: strings are split character by character, sharing common prefixes along tree branches. For example, `app`, `apple`, and `apply` all share the common path `a -> p -> p`.

Article Overview:

1. What is a Trie?
2. Why is a Trie well-suited for prefix matching?
3. How to design a Trie node?
4. How to implement insertion, search, and prefix matching in a Trie?
5. How to choose between a Trie and a Hash Table?

![Diagram illustrating how a Trie organizes a set of strings via character paths](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/data-structure/trie-4a6afdfb.png)

## What is a Trie?

A Trie is a tree data structure specifically designed for sets of strings. Unlike binary search trees, nodes in a Trie are generally not ordered by comparative magnitude ("less than" or "greater than"), but rather by **character paths**.

You can understand it through the following rules:

- The root node does not represent any specific character; it merely acts as the entry point for all strings.
- Starting from the root node, each downward step along an edge matches a single character of the string.
- The concatenated characters along the path from the root to any given node form a prefix.
- If a node is marked as the end of a word (`isWord = true`), the string formed from the root to that node represents a complete, valid word.

For example, after inserting `app`, `apple`, and `apply`, they share the initial path `a -> p -> p`. The node corresponding to the final `p` in `app` must be marked as the end of a word; otherwise, the Trie would only know that `app` is a prefix of other words, unable to determine whether it is an independent word in its own right.

This highlights the critical role of the `isWord` boolean flag. Without it, you cannot distinguish whether a path represents merely an incomplete prefix or a standalone complete word.

## Why is a Trie Well-Suited for Prefix Matching?

A hash table is excellent for checking whether an exact, complete string exists—such as determining whether `apple` is present in a set ($O(L)$ where $L$ is string length). However, if the query becomes "find all words starting with `app`," a hash table becomes clumsy: unless you maintain a secondary prefix index, you must scan all keys in the hash table.

The advantage of a Trie is that any prefix naturally corresponds to a unique path down the tree. When querying the prefix `app`, you simply traverse from the root node through `a`, `p`, and `p`:

- If any character branch does not exist along the way, no word in the collection has `app` as a prefix.
- If you successfully reach the final `p` node, every word in the subtree beneath this node starts with `app`.

Consequently, the time complexity of prefix lookups in a Trie depends primarily on the length of the prefix, rather than the total number of words stored in the dictionary. This property is invaluable in search autocomplete, longest prefix matching in IP routing, and dictionary filtering.

## Key Interview Evaluation Points

- Ability to articulate clearly why a Trie is superior for prefix searches.
- Ability to code insertion, exact word search, and prefix search from scratch.
- Ability to analyze time complexity in terms of string length.
- Ability to explain the trade-offs regarding potential memory overhead.
- Ability to contrast and compare Trie with Hash Tables.

## Node Structure

A Trie node typically encapsulates two pieces of information:

1. References to child nodes, used to continue matching subsequent characters.
2. A boolean flag indicating whether the node marks the termination of a complete word.

If the input is restricted to lowercase English letters, a fixed-size array of length 26 is optimal:

```java
class TrieNode {
    TrieNode[] children = new TrieNode[26];
    boolean isWord;
}
```

If the character set is dynamic or arbitrarily large, `Map<Character, TrieNode>` provides flexible memory usage at the expense of hash lookup overhead and object wrapper overhead.

Neither approach is strictly superior; they serve different requirements:

| Node Implementation Approach | Advantages | Disadvantages |
| ---------------------------- | ---------- | ------------- |
| `TrieNode[] children = new TrieNode[26]` | Extremely fast access, ideal for small fixed character sets | Wastes memory when many child pointers remain null |
| `Map<Character, TrieNode>` | Flexible, only allocates space for existing characters | Extra object allocations and hash access overhead |

In an interview coding session, if the problem explicitly specifies lowercase English letters, an array is the cleanest and most efficient choice; if the character set includes uppercase letters, Unicode/Chinese characters, URL paths, or arbitrary symbols, a `Map` is far safer.

## Basic Implementation

The following implementation assumes strings contain only lowercase English letters (`'a'` through `'z'`):

```java
class Trie {
    private final TrieNode root = new TrieNode();

    public void insert(String word) {
        TrieNode node = root;
        for (char c : word.toCharArray()) {
            int index = c - 'a';
            if (node.children[index] == null) {
                node.children[index] = new TrieNode();
            }
            node = node.children[index];
        }
        node.isWord = true;
    }

    public boolean search(String word) {
        TrieNode node = find(word);
        return node != null && node.isWord;
    }

    public boolean startsWith(String prefix) {
        return find(prefix) != null;
    }

    private TrieNode find(String text) {
        TrieNode node = root;
        for (char c : text.toCharArray()) {
            int index = c - 'a';
            if (node.children[index] == null) {
                return null;
            }
            node = node.children[index];
        }
        return node;
    }
}
```

The underlying logic for insertion and lookup follows the exact same traversal pattern: start from the root node and move downwards character by character. During insertion, if a child node does not exist, create it; during queries, if a child node does not exist, return `null` / `false`. The only difference lies in the final step: `search()` verifies `isWord`, whereas `startsWith()` only requires that the entire prefix path exists.

## Understanding the Delete Operation

Deleting a word from a Trie is notably more error-prone than insertion or search, because you cannot simply prune the entire character path.

For instance, if the Trie contains both `app` and `apple`, deleting `app` only requires clearing the `isWord` flag on the final `p` node of `app`. You cannot remove the path `a -> p -> p`, because doing so would destroy the word `apple`.

To physically prune nodes, you must inspect backwards from the tail of the word: a node can only be safely removed if it has no children AND does not mark the end of another word. In interviews, unless deletion is explicitly required, focus on writing rock-solid insertion, search, and prefix query methods first.

## Complexity

Let $L$ be the length of the string:

- Insertion: $O(L)$
- Exact word search: $O(L)$
- Prefix search: $O(L)$

Space complexity depends on the total number of nodes created. In the worst case, where strings share almost no common prefixes, memory usage approaches the sum of the lengths of all stored strings multiplied by node pointer overhead.

If you also need to enumerate all words sharing a given prefix, the time complexity involves $O(L)$ to locate the prefix node, plus a subtree traversal whose cost is proportional to the size of that subtree and the number of matching results.

## How to Choose Between a Trie and a Hash Table?

| Scenario | Trie | Hash Table |
| -------- | ---- | ---------- |
| Exact string query | Supported, but requires more memory | More direct and lightweight |
| Prefix query | Highly optimal | Requires custom secondary indexing |
| Enumerate words by prefix | Highly optimal | Inconvenient / expensive |
| Very large or arbitrary character set | Requires adaptive node structures | Straightforward |

If the problem only requires checking whether an exact word exists, a Hash Table is typically simpler and more memory-efficient. If frequent prefix queries are needed, a Trie is far superior.

Another key nuance: Hash Table lookups are generally more memory-efficient and universally applicable, but store keys as opaque units. A Trie explicitly materializes common prefixes into branching paths, naturally unlocking capabilities like prefix matching, prefix-based enumeration, and longest prefix matching. They address fundamentally different problem dimensions rather than rendering each other obsolete.

## Engineering Scenarios

- Search box autocomplete: Retrieve suggested search terms based on user input prefixes.
- Sensitive word filtering: A Trie combined with failure pointers forms an Aho-Corasick automaton for high-throughput multi-pattern string matching.
- IP routing lookup: Longest Prefix Matching (LPM) algorithms in network routers adapt Trie concepts.
- Spell checking and dictionary validation: Fast verification of word validity and prefixes.

In production engineering, you will also encounter several Trie variants:

- **Compressed Trie / Radix Tree**: Compresses chains of single-child nodes into string chunks, drastically reducing node count and tree depth.
- **Ternary Search Trie (TST)**: Each node branches in three directions (less than, equal to, greater than), balancing spatial efficiency and query flexibility.
- **AC Automaton (Aho-Corasick)**: Augments a Trie with failure transitions for simultaneous multi-pattern string searching.

You do not need to memorize all of these variants upfront, but understanding the foundational Trie concept provides the stepping stone for all of them: representing strings as paths and sharing common prefixes.

## Common Pitfalls

- Never omit the `isWord` flag; otherwise, you cannot differentiate `app` from `apple`.
- The character set is not always limited to lowercase letters; adapt node designs to the specific interview requirements.
- Word deletion is more complex than insertion/search; always verify whether nodes are reused by other words before pruning.
- Trie query complexity depends on string length, not directly on the total number of words in the dictionary.

## Recommended Practice Problems

- [208. Implement Trie (Prefix Tree)](https://leetcode.cn/problems/implement-trie-prefix-tree/)
- [211. Design Add and Search Words Data Structure](https://leetcode.cn/problems/design-add-and-search-words-data-structure/)
- [212. Word Search II](https://leetcode.cn/problems/word-search-ii/)
- [648. Replace Words](https://leetcode.cn/problems/replace-words/)

## References

- [Algorithms, 4th Edition: Tries](https://algs4.cs.princeton.edu/52trie/)
- [Algorithms, 4th Edition: TrieST API](https://algs4.cs.princeton.edu/code/javadoc/edu/princeton/cs/algs4/TrieST.html)
- [Stanford CS166: Tries and Suffix Trees](https://web.stanford.edu/class/archive/cs/cs166/cs166.1216/lectures/16/Slides16.pdf)
