---
title: Sensitive Word Filtering Solutions Summary
description: Detailed guide to sensitive word filtering solutions, tracing the algorithm evolution from brute-force matching to Trie trees and the Aho-Corasick automaton, covering complexity analysis, engineering practices, and high-concurrency optimization strategies.
category: System Design
tag:
  - Security
  - Data Structures
head:
  - - meta
    - name: keywords
      content: Sensitive Word Filtering,Trie Tree,DFA Algorithm,Aho-Corasick Automaton,Double-Array Trie,String Matching,KMP Algorithm,Content Security,Atomic Hot-Swap
lang: en
sourceRef: zh-ref/system-design/security/sentive-words-filter.md
---

Sensitive word filtering is a core component of content security. Whether on social media, e-commerce platforms, online games, or today's AI applications, both user inputs and generated content need real-time filtering to prevent the spread of violating content such as pornography, violence, and hate speech.

From a technical perspective, sensitive word filtering is essentially a **multi-pattern string matching problem**: searching for multiple keywords simultaneously within a piece of text.

This article is nearly 20,000 characters long. I will start from the evolution of the algorithms and also share practical production experience such as countering obfuscated variant words, high-concurrency optimization, and wordlist management.

**Core Takeaways**:

| Algorithm                   | Applicable Scenario               | Characteristics                                          |
| --------------------------- | --------------------------------- | -------------------------------------------------------- |
| **Trie Tree**               | Small wordlists (< 10,000 words)  | Simple implementation, easy to understand                |
| **AC Automaton**            | High-throughput scenarios         | Matches all words in a single scan; optimal performance  |
| **Double-Array Trie (DAT)** | Large wordlists (> 10,000 words)  | Low memory footprint, high construction cost             |

## Algorithm Evolution

Below, in order **from simple to complex**, we introduce various sensitive word filtering algorithms step by step to examine the motivation and impact of each optimization.

### Brute Force (BF Algorithm)

**Brute Force** matching is the most intuitive approach: iterate through every position in the text and attempt to match each sensitive word.

Suppose the sensitive wordlist has `n` words with an average length of `m`, and the text to be matched has length `L`:

```java
public List<String> bruteForceMatch(String text, List<String> words) {
    List<String> result = new ArrayList<>();
    for (String word : words) {              // O(n): iterate over each sensitive word
        if (text.contains(word)) {           // O(L × m): naive substring matching
            result.add(word);
        }
    }
    return result;
}
```

**Time Complexity**: O(n × L × m)

| Scenario     | Wordlist Size | Text Length | Average Word Length | Operations  |
| ------------ | ------------- | ----------- | ------------------- | ----------- |
| Small-scale  | 100           | 1000        | 5                   | 500,000     |
| Medium-scale | 1000          | 5000        | 5                   | 25,000,000  |
| Large-scale  | 10000         | 10000       | 5                   | 500,000,000 |

**Problem Analysis**:

1. **Repeated scanning**: Every sensitive word scans the entire text, causing massive redundant character comparisons.
2. **No state reuse**: Sensitive words are independent of one another, making it impossible to reuse previously matched information.
3. **Poor scalability**: Performance degrades linearly as the wordlist grows.

When the wordlist reaches tens of thousands of entries, brute-force matching latency hits the second level, completely failing to meet online service performance requirements.

### Trie Tree: Reducing Comparisons Using Prefixes

A **Trie tree** (pronounced /ˈtraɪ/), also known as a dictionary tree or prefix tree, optimizes brute-force matching via a **space-for-time trade-off**. The core idea is to leverage **common prefixes** of strings to reduce both storage overhead and query time.

Keyword autocomplete in a browser search box can be implemented based on a Trie tree:

![Browser Trie tree demonstration](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/brower-trie-2a2c090e.png)

#### Basic Properties

A Trie tree has the following 3 fundamental properties:

1. **The root node contains no character**; every node other than the root stores exactly one character.
2. **From the root node to any given node**, concatenating the characters along the path yields the string corresponding to that node.
3. **All child nodes of a node contain distinct characters**.

#### Structure Example

Suppose the sensitive wordlist contains the following terms:

- `"高清视频"` (HD video)
- `"高清 CV"` (HD CV)
- `"东京冷"` (Tokyo Cold)
- `"东京热"` (Tokyo Hot)

The constructed Trie tree structure is as follows (red nodes indicate string termination):

![Sensitive word Trie tree](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/sensitive-word-trie-8f71e1f2.png)

When searching for the string `"东京热"` (Tokyo Hot), it is split into individual characters `"东"`, `"京"`, and `"热"`, and matched layer by layer starting from the root node.

#### Comparison with Brute Force

Suppose the wordlist is `["she", "he", "his", "hers"]`, searching in the text `"ushers"`:

| Algorithm   | Matching Process                                     | Character Comparisons |
| ----------- | ---------------------------------------------------- | --------------------- |
| Brute Force | Scans the text separately with each of the 4 words   | ~24 times¹            |
| Trie Tree   | Starts from each position and matches along the tree | ~10 times             |

> ¹ This is a simplified estimate (number of words × text length); the actual worst-case number of comparisons depends on each word's length and positions in the text, and can be higher.

The advantage of a Trie tree is that **all sensitive words share the same tree**, allowing a single traversal to attempt matching all words.

#### Complexity Analysis

| Metric           | HashMap Implementation | Array Implementation |
| ---------------- | ---------------------- | -------------------- |
| Preprocessing    | O(n × m)               | O(n × m × σ)         |
| Query Time       | O(L × m)               | O(L × m)             |
| Space Complexity | O(n × m)               | O(n × m × σ)         |

> σ is the alphabet size (~20,000 for Chinese characters, only 128 for ASCII). The code examples in this article use a `HashMap` implementation, which suits large character sets like Chinese; array implementations suit small character sets (such as pure English).

#### Trie Code Example

```java
public class SimpleTrie {
    private static class Node {
        Map<Character, Node> children = new HashMap<>();
        boolean isEnd;
    }

    private final Node root = new Node();

    // Add a sensitive word
    public void addWord(String word) {
        Node node = root;
        for (char c : word.toCharArray()) {
            node = node.children.computeIfAbsent(c, k -> new Node());
        }
        node.isEnd = true;
    }

    // Check whether the text contains any sensitive word
    public boolean contains(String text) {
        for (int i = 0; i < text.length(); i++) {
            Node node = root;
            for (int j = i; j < text.length(); j++) {
                node = node.children.get(text.charAt(j));
                if (node == null) break;
                if (node.isEnd) return true;
            }
        }
        return false;
    }

    // Retrieve all matched sensitive words in the text
    public List<String> matchAll(String text) {
        List<String> result = new ArrayList<>();
        for (int i = 0; i < text.length(); i++) {
            Node node = root;
            for (int j = i; j < text.length(); j++) {
                node = node.children.get(text.charAt(j));
                if (node == null) break;
                if (node.isEnd) {
                    result.add(text.substring(i, j + 1));
                }
            }
        }
        return result;
    }
}
```

#### Limitations of the Trie Tree

Although a Trie tree offers significant improvements over brute-force matching, it still suffers from **backtracking**:

When searching for the wordlist `["she", "he", "his"]` in the text `"ushers"`:

1. Starting at position 1, match `"s" → "h" → "e"` and find `"she"`.
2. After matching completes, **backtrack to position 2**, re-match `"h" → "e"`, and find `"he"`.

This strategy of "rolling back to the next position and restarting after a match or mismatch" degrades to O(L × m) in the worst case (e.g., matching `"aaaaab"` in the text `"aaaaaaaa"`).

Can we eliminate **backtracking completely**? That leads us to the AC Automaton.

**Note**: `PatriciaTrie` provided by [Apache Commons Collections](https://mvnrepository.com/artifact/org.apache.commons/commons-collections4) is a **bit-level** compressed binary Trie (PATRICIA = Practical Algorithm To Retrieve Information Coded In Alphanumeric). Its mechanism differs from the **character-level Trie** described in this article and is not suitable for direct use in Chinese sensitive word filtering scenarios.

### AC Automaton: Matching All Words in a Single Scan

The **AC Automaton (Aho-Corasick Automaton)** is a multi-pattern matching algorithm built on top of a Trie tree, proposed in 1975 by Alfred V. Aho and Margaret J. Corasick at Bell Labs.

Its core idea comes from the same lineage as the KMP algorithm: **leverage already matched information to jump directly to an appropriate state upon mismatch, avoiding backtracking**. The difference is that KMP handles a single pattern string, whereas the AC Automaton handles multiple pattern strings.

#### Core Components

The operation of an AC Automaton relies on three core functions:

| Function             | Role                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------- |
| **goto function**    | State transition: determines which state to move to after reading a character from the current state |
| **failure function** | Mismatch jump: jumps to the "longest matching suffix" state upon mismatch to avoid backtracking |
| **output function**  | Match output: records the set of matched words associated with each state                      |

#### Construction Steps

Building an AC Automaton consists of three steps:

![AC Automaton construction and matching flow](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/sensitive-word-ac-automaton-flow-8921f53f.png)

**Step 1: Build the Trie Tree**

Insert all pattern strings into the Trie tree to form the foundational skeleton of the automaton. Mark the ending node of each pattern string as a terminal node.

**Step 2: Build `fail` Pointers (Core)**

The `fail` pointer is the core mechanism of the AC Automaton. Its role is: **when the current character cannot continue matching, which state should we jump to in order to keep trying, rather than returning to the start**.

Construction uses BFS (Breadth-First Search) to traverse level by level. For the current node `temp`:

1. Find the `fail` node of `temp`'s parent node.
2. Check whether that `fail` node has a child with the same character as `temp`.
3. If it exists, point `temp.fail` to that child node.
4. If it does not exist, continue following the `fail` node's `fail` node until one is found or `root` is reached.

**The essence of the `fail` pointer**: It points to the state corresponding to the **longest suffix** of the string represented by the current state.

::: tip Relationship with KMP
The `fail` pointer is a generalization of the `next` array from the KMP algorithm onto a Trie tree. For example, the suffix `"he"` of `"she"` matches the prefix of `"he"`, so the `fail` pointer of `'e'` at the end of `"she"` points to `'e'` in `"he"`.
:::

**Step 3: Pattern Matching**

Scan from the beginning of the text string, with pointer `p` initially pointing to `root`:

1. **State transition**: If the current character exists among `p`'s children, move `p` down to that child; otherwise, follow the `fail` chain backward until a transition is possible or `p` returns to `root`.
2. **Collect outputs**: [Key] After every transition, **you must traverse along the `fail` chain** to collect all matched words from terminal states.

Why traverse along the `fail` chain? Because a suffix of a longer word may itself be another shorter word. For instance, when `"she"` matches successfully, traversing the `fail` chain finds `"he"`; otherwise, nested words would be missed.

#### AC Automaton Code Example

```java
public class AhoCorasickAutomaton {
    private static class Node {
        Map<Character, Node> children = new HashMap<>();
        Node fail;                    // Failure pointer
        List<String> outputs = new ArrayList<>(); // Matched words for this state
    }

    private final Node root = new Node();

    // Step 1: Build the Trie tree
    public void addWord(String word) {
        Node node = root;
        for (char c : word.toCharArray()) {
            node = node.children.computeIfAbsent(c, k -> new Node());
        }
        node.outputs.add(word); // Record matched word at the ending node
    }

    // Step 2: Build fail pointers (BFS)
    public void buildFailPointer() {
        Queue<Node> queue = new LinkedList<>();
        root.fail = root;

        // Direct children of root have their fail pointer set to root
        for (Node child : root.children.values()) {
            child.fail = root;
            queue.offer(child);
        }

        while (!queue.isEmpty()) {
            Node current = queue.poll();
            for (Map.Entry<Character, Node> entry : current.children.entrySet()) {
                char c = entry.getKey();
                Node child = entry.getValue();

                // Follow parent's fail chain to find a transition for character c
                Node fail = current.fail;
                while (fail != root && !fail.children.containsKey(c)) {
                    fail = fail.fail;
                }
                child.fail = fail.children.getOrDefault(c, root);
                // Avoid self-loop: if fail points to itself, redirect to root
                if (child.fail == child) {
                    child.fail = root;
                }
                // Merge outputs from the fail node (critical!)
                child.outputs.addAll(child.fail.outputs);
                queue.offer(child);
            }
        }
    }

    // Step 3: Pattern matching (single scan)
    public List<String> match(String text) {
        List<String> result = new ArrayList<>();
        Node state = root;

        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            // Follow the fail chain to find a state that can handle character c
            while (state != root && !state.children.containsKey(c)) {
                state = state.fail;
            }
            state = state.children.getOrDefault(c, root);
            // Collect all matched words at current state (already merged via fail chain)
            result.addAll(state.outputs);
        }
        return result;
    }
}
```

Usage example:

```java
AhoCorasickAutomaton ac = new AhoCorasickAutomaton();
ac.addWord("she");
ac.addWord("he");
ac.addWord("her");
ac.addWord("hers");
ac.buildFailPointer(); // After inserting all words, build fail pointers once

List<String> matches = ac.match("ushers");
// Output: [she, he, her, hers]
```

#### Performance Comparison

| Algorithm    | Preprocessing | Matching Time | Characteristics                                                     |
| ------------ | ------------- | ------------- | ------------------------------------------------------------------- |
| Brute Force  | O(1)          | O(L × n × m)  | Scans separately for each word                                      |
| Trie Tree    | O(n × m)      | O(L × m)      | May backtrack                                                       |
| AC Automaton | O(n × m)¹     | O(L + z)      | Single scan; z is total number of matched hits (including overlaps)² |

> 1. O(n × m) when using `HashMap` to store child nodes; if using arrays (requiring pre-allocation of alphabet size σ), it is O(n × m × σ).
> 2. In extreme scenarios, if the wordlist contains heavily nested words (such as `"a"`, `"ab"`, `"abc"`, ..., `"abc...z"`), z can be much larger than L, and execution time is dominated by z. In practical engineering, sensitive wordlists rarely exhibit such extreme nesting.

The AC Automaton achieves **linear-time matching**, independent of the number of sensitive words and dependent only on text length and the number of matched results.

Combining the AC Automaton with DAT ([AhoCorasickDoubleArrayTrie](https://github.com/hankcs/AhoCorasickDoubleArrayTrie)) balances both matching efficiency and memory consumption.

### Double-Array Trie (DAT): Compressing Memory Usage

A standard Trie tree consumes considerable memory (every node requires a `Map`). In real-world engineering, an improved variant—**Double-Array Trie (DAT)**—is typically used.

DAT was proposed by Jun-ichi Aoe et al. from Japan in their 1989 paper [An Efficient Implementation of Trie Structures](https://www.co-ding.com/assets/pdf/dat.pdf). It compresses the Trie structure using two integer arrays (`base[]` and `check[]`):

| Feature          | Standard Trie (Array Implementation) | Double-Array Trie                           |
| ---------------- | ------------------------------------ | ------------------------------------------- |
| Space Complexity | O(n × m × σ)                         | O(n × m)                                    |
| Memory Usage     | High                                 | Typically reduced to 20%–30% of array-based |
| Implementation   | Simple                               | Complex (requires handling collisions)      |

**Note**: The compression efficiency of DAT strongly correlates with the ratio of shared prefixes in the wordlist. In extreme cases (no shared prefixes), compression gains are limited.

Reference implementation: <https://github.com/komiya-atsushi/darts-java>

### DFA Implementation: Engineering Encapsulation

**DFA (Deterministic Finite Automaton)** is a concept from automata theory. From an implementation perspective, a single match traversal starting from the root of a Trie is itself a DFA run—each node represents a state, and each edge represents a character transition. However, plain Trie matching has to restart the DFA from every position in the text, whereas the AC Automaton completes all state transitions via `fail` pointers, making it a true **single-scan multi-pattern DFA**.

[Hutool 5.8.x](https://hutool.cn/docs/#/dfa/%E6%A6%82%E8%BF%B0) provides a DFA-based sensitive word filtering implementation (backed by a Trie):

![Hutool's DFA algorithm](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/hutool-dfa-3208b9f3.png)

```java
WordTree wordTree = new WordTree();
wordTree.addWord("大");
wordTree.addWord("大憨憨");
wordTree.addWord("憨憨");

String text = "那人真是个大憨憨！";

// Get the first matched keyword
String matchStr = wordTree.match(text);
System.out.println(matchStr); // Output: 大

// matchAll(text, limit, isDensityMatch, isGreedy)
// - limit: maximum number of matches, -1 means unlimited
// - isDensityMatch: whether to enable density matching (continue searching for overlapping words inside matched words)
// - isGreedy: whether to enable greedy matching (true matches longest keyword, false matches shortest keyword)
List<String> matchStrList = wordTree.matchAll(text, -1, false, false);
System.out.println(matchStrList); // Output: [大, 憨憨]

List<String> matchStrList2 = wordTree.matchAll(text, -1, false, true);
System.out.println(matchStrList2); // Output: [大, 大憨憨]
```

**Output Explanation**:

- `matchAll(text, -1, false, false)`: Non-greedy + non-density matching

  - Starting from position 0, `"大"` matches successfully (shortest match).
  - After skipping the matched character, `"憨憨"` matches successfully starting from position 2.
  - Result: `[大, 憨憨]`

- `matchAll(text, -1, false, true)`: Greedy + non-density matching
  - Starting from position 0, `"大憨憨"` matches successfully (longest match).
  - At the same time, `"大"` also matches successfully (as a prefix).
  - Result: `[大, 大憨憨]`

## Countering Variant Words

In real-world scenarios, users often bypass sensitive word filtering in the following ways:

| Obfuscation Method               | Example                        | Countermeasure                          |
| -------------------------------- | ------------------------------ | --------------------------------------- |
| Homophones                       | `"赌博"` (gambling) → `"读博"` (PhD study) | Maintain a homophone wordlist           |
| Inserted Symbols                 | `"fuck"` → `"f\*u\*c\*k"`      | Preprocess to strip special characters  |
| Mixed Traditional/Simplified     | `"台灣"` → `"台湾"`            | Convert uniformly to Simplified Chinese before matching |
| Full-Width Characters            | `"abc"` → `"ａｂｃ"`           | Convert full-width to half-width        |

**Pre-cleaning** is a common strategy for handling variant words: normalizing a copy of the text used for detection before matching. The code below covers basic cases such as compatibility equivalence characters, letter casing, Unicode Code Points, and format control characters, though it remains only an example; production systems must continuously supplement rules based on supported languages, false-positive tolerance, and real-world adversarial samples.

```java
import java.text.Normalizer;
import java.util.Locale;

public String preprocess(String text) {
    // NFKC unifies compatibility-equivalent characters such as full-width/half-width. Only process the detection copy; do not overwrite the user's original text.
    String normalized = Normalizer.normalize(text, Normalizer.Form.NFKC)
            .toLowerCase(Locale.ROOT);
    StringBuilder sb = new StringBuilder();
    normalized.codePoints()
            // Remove format control characters such as zero-width joiners to prevent bypassing via invisible characters.
            .filter(codePoint -> Character.getType(codePoint) != Character.FORMAT)
            .filter(this::isChineseOrAlphanumeric)
            .forEach(sb::appendCodePoint);
    return toSimplifiedChinese(sb.toString()); // Traditional to Simplified Chinese
}

private boolean isChineseOrAlphanumeric(int codePoint) {
    return Character.isLetterOrDigit(codePoint)
            || Character.UnicodeScript.of(codePoint) == Character.UnicodeScript.HAN;
}
```

Mature libraries such as [ToolGood.Words](https://github.com/toolgood/ToolGood.Words) already include built-in Traditional/Simplified Chinese conversion, full-width/half-width conversion, and more, and can be used directly.

::: warning Note

- **Position Mapping**: The `preprocess` method removes special characters, so character positions in the cleaned text no longer correspond one-to-one with the original text. If the business logic needs to return exact positions of sensitive words in the original text (e.g., highlighting or partial replacement), you must maintain a mapping table from cleaned positions back to original text positions.
- **Normalization Boundaries**: NFKC eliminates certain compatibility-character differences that may carry business semantics, so it should only be applied to the detection copy while preserving the original text for display and auditing. Removing characters can also merge previously separated content into new words, so false-positive rates must be evaluated against real corpora.
- **Confusables (Homoglyphs)**: Unicode confusables can assist in detecting visually similar cross-script characters, but are not suitable as a direct "normalized result" for general text. High-risk hits should combine contextual models or human review rather than relying solely on character substitution for final decisions.
:::

## High-Concurrency Optimization

### Atomic Hot-Swap: Supporting Live Wordlist Updates

In production environments, the sensitive wordlist requires frequent updates without interrupting in-flight matching requests. Implementing **Atomic Hot-Swap** via `AtomicReference`: build the new Trie in the background first, and once built, atomically replace the old instance so reader threads remain unaffected.

```java
public class SensitiveWordFilter {
    private final AtomicReference<SimpleTrie> trieRef;

    public SensitiveWordFilter(List<String> initialWords) {
        this.trieRef = new AtomicReference<>(buildTrie(initialWords));
    }

    // Retrieve current Trie when matching
    public List<String> match(String text) {
        SimpleTrie trie = trieRef.get();
        return trie != null ? trie.matchAll(text) : Collections.emptyList();
    }

    // Update wordlist: build the new Trie first, then publish atomically
    public void refreshWords(List<String> newWords) {
        SimpleTrie newTrie = buildTrie(newWords);
        trieRef.set(newTrie);  // Atomic publication, immediately visible to reader threads
    }

    private SimpleTrie buildTrie(List<String> words) {
        SimpleTrie trie = new SimpleTrie();
        for (String word : words) {
            trie.addWord(word);
        }
        return trie;
    }
}
```

**Key Points**:

- Using `AtomicReference` guarantees that the switch operation is atomic.
- Previous Trie instances may still be in use by active threads and rely on GC for automatic reclamation.
- New Tries can be built asynchronously in the background without impacting service response latency.

### Parallel Processing: Splitting Ultra-Long Text

For ultra-long texts (such as articles or long comments), the text can be segmented into chunks and processed in parallel.

**Note**: Overlap regions must be included during segmentation; otherwise, sensitive words spanning chunk boundaries will be missed.

```java
// Use a dedicated thread pool to avoid occupying ForkJoinPool.commonPool()
private final ExecutorService filterExecutor =
    new ThreadPoolExecutor(
        4, 8, 60L, TimeUnit.SECONDS,
        LinkedBlockingQueue<>(1000),
        new ThreadPoolExecutor.CallerRunsPolicy() // When queue is full, execute on caller thread for backpressure
    );

public List<String> parallelMatch(String text, int chunkSize, int maxWordLength) {
    // Overlap region = max sensitive word length - 1, preventing missed words across boundaries
    int overlap = maxWordLength - 1;
    List<CompletableFuture<List<String>>> futures = new ArrayList<>();

    for (int i = 0; i < text.length(); i += chunkSize) {
        int start = i;
        int end = Math.min(i + chunkSize + overlap, text.length());
        String chunk = text.substring(start, end);

        // Explicitly pass the custom thread pool
        futures.add(CompletableFuture.supplyAsync(() ->
            trieRef.get().matchAll(chunk), filterExecutor
        ));
    }

    return futures.stream()
        .flatMap(f -> f.join().stream())
        .distinct()
        .collect(Collectors.toList());
}
```

**Why Is an Overlap Region Needed?**

Suppose the sensitive word `"赌博网站"` (gambling website) has length 4, and `chunkSize` is 100. If the word starts at position 99 in the text, it gets split across two chunks:

- chunk1: `...text ends at position 99赌`
- chunk2: `博网站 continues...`

Neither chunk can match the complete `"赌博网站"`, resulting in a false negative (missed detection). The overlap region ensures that every sensitive word appears intact in at least one chunk.

### Fast Exclusion: Bloom Filter

Using a **Bloom Filter** for initial screening can quickly exclude texts that do not contain sensitive words.

**Prerequisite**: This approach only yields benefits when the vast majority of texts contain no sensitive words and the Bloom Filter's false-positive rate is extremely low. Because `quickCheck` itself has complexity O(L × maxWordLen)—the same order as Trie matching—if texts frequently hit the Bloom Filter (false positives), it actually adds extra overhead.

**Note**: A Bloom Filter checks set membership for individual elements, so you must test substrings of the text rather than the entire text string.

```java
public List<String> matchWithBloomFilter(String text, int maxWordLength) {
    // Quick check: scan all possible substrings
    if (!quickCheck(text, maxWordLength)) {
        return Collections.emptyList();  // Definitely contains no sensitive words
    }
    // Might contain sensitive words; perform exact matching
    return trieRef.get().matchAll(text);
}

private boolean quickCheck(String text, int maxWordLen) {
    BloomFilter<String> filter = getBloomFilter();  // Bloom Filter containing all sensitive words
    for (int i = 0; i < text.length(); i++) {
        for (int len = 1; len <= maxWordLen && i + len <= text.length(); len++) {
            if (filter.mightContain(text.substring(i, i + len))) {
                return true;  // Possibly contains; requires exact matching
            }
        }
    }
    return false;  // Definitely does not contain
}
```

**Applicable Scenario**: When the sensitive word hit rate is low, a Bloom Filter can quickly filter out large volumes of clean text and reduce Trie matching invocations. However, Bloom Filter scanning itself incurs O(L × maxWordLen) overhead, so whether to enable it should be evaluated based on actual traffic characteristics.

## Open-Source Projects

| Project                                                                            | Language             | Min JDK | Features                                                                                                | Applicable Scenario                     |
| ---------------------------------------------------------------------------------- | -------------------- | ------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| [ToolGood.Words](https://github.com/toolgood/ToolGood.Words)                       | C#/Java/Python/Go/JS | Java 8+ | Multi-language support; built-in Traditional/Simplified, full/half-width, Pinyin conversion; C# version exceeds 300M chars/sec | Multi-language projects                 |
| [Hutool DFA](https://hutool.cn/docs/#/dfa/%E6%A6%82%E8%BF%B0)                      | Java                 | Java 8+ | Lightweight, concise API, implemented on top of Trie                                                    | Small to medium-sized wordlists         |
| [AhoCorasickDoubleArrayTrie](https://github.com/hankcs/AhoCorasickDoubleArrayTrie) | Java                 | Java 7+ | AC Automaton + Double-Array Trie, excellent performance                                                 | Large wordlists, high throughput        |

## Production Recommendations

### Wordlist Management

- **Periodic updates**: Sensitive wordlists need ongoing maintenance and should support hot reloading to avoid service restarts.
- **Tiered management**: Categorize words into high/medium/low sensitivity based on business scenarios and apply different handling strategies (immediate blocking, manual review, logging).
- **Allowlist mechanism**: Maintain an allowlist (whitelist) to prevent false positives. Typical examples include sensitive word `"XXX"` falsely flagging normal word `"XXY"` (substring mismatch), or `"公安"` (public security) falsely flagging `"办公安排"` (office scheduling, which contains the adjacent characters `"公安"` across word boundaries). Common countermeasures include allowlist phrase exclusions, requiring minimum match lengths (such as matching whole words rather than substrings), and context-window evaluation.
- **Match logging**: Record match results for wordlist optimization and false-positive analysis.

### Exception Handling

- **Wordlist loading failure**: When building a new Trie fails (e.g., OOM or corrupted file), keep the old Trie unchanged, log the error, and trigger an alert.
- **Empty wordlist handling**: When the wordlist is empty, log a `WARN` message rather than silently letting all text pass through.
- **Matching timeout**: For ultra-long texts combined with large wordlists, configure timeout circuit breaking. When high-risk content times out, it should be rejected, quarantined, or routed to manual review rather than allowed through by default; fail-open should only be adopted for explicitly low-risk scenarios after business approval, alongside input length limits, metric recording, and timely alerting.

### Monitoring Metrics

| Metric                 | Recommended Threshold | Description                                                      |
| ---------------------- | --------------------- | ---------------------------------------------------------------- |
| Matching Latency (p99) | < 10ms                | Single-pass filtering duration                                   |
| False-Positive Rate    | < 1%                  | Normal content mistakenly flagged as sensitive                   |
| False-Negative Rate    | Continuous monitoring | Sensitive content missed by detection                            |
| Wordlist Hit Rate      | Analyze as needed     | Trigger frequency of each sensitive word for wordlist tuning     |

### Architecture Recommendations

![](/media/jg/ext/oss.javaguide.cn/javaguide/system-design/security/sensitive-word-filter-arch-fc6046a9.png)

## References

### Academic Papers

- Unicode Standard Annex #15 - Unicode Normalization Forms: <https://www.unicode.org/reports/tr15/>
- Unicode Technical Standard #39 - Unicode Security Mechanisms: <https://www.unicode.org/reports/tr39/>
- Aho, A.V. and Corasick, M.J. (1975). "[Efficient string matching: An aid to bibliographic search](https://dl.acm.org/doi/10.1145/360825.360855)." _Communications of the ACM_, 18(6), 333-340. (Original AC Automaton paper)
- Aoe, J., Morimoto, K., and Sato, T. (1989). "[An Efficient Implementation of Trie Structures](https://www.co-ding.com/assets/pdf/dat.pdf)." _Software: Practice and Experience_.

### Related Patents

- [An Automatic Sensitive Word Filtering and Management System](https://patents.google.com/patent/CN101964000B)
- [Method and System for Sensitive Word Filtering in Online Games](https://patents.google.com/patent/CN103714160A/zh)
