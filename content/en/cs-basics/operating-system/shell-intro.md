---
title: Summary of Shell Scripting Fundamentals
description: Shell scripting is extremely practical in our daily engineering work. Currently, Shell and Python are the most popular automation languages in the Linux ecosystem. This article summarizes the core fundamentals of Shell scripting to help you get started!
category: CS Basics
tag:
  - Operating System
  - Linux
head:
  - - meta
    - name: keywords
      content: Shell, scripts, commands, automation, devops, Linux, basic syntax
lang: en
sourceRef: zh-ref/cs-basics/operating-system/shell-intro.md
---

Shell scripting is extraordinarily practical in our daily engineering work. In modern Linux ecosystems, Shell and Python are by far the two most dominant languages for operations and automation.

This article summarizes the fundamental knowledge of Shell scripting to guide you smoothly into writing Shell scripts!

## Version Compatibility Note

**Examples in this article are targeted at bash version 4.0+**. Different versions of bash exhibit differences across certain features, particularly:

- **Arrays**: Supported since bash 2.0+; pure POSIX sh (such as dash) does not support arrays.
- **Specific string operations**: Such as `${var:offset:length}`, which may not be supported in older versions.
- **Arithmetic expansion `$((...))`**: Supported since bash 2.0+.

Check your bash version:

```shell
bash --version
# or
echo $BASH_VERSION
```

## Stepping Through the Door of Shell Scripting

### Why Learn Shell Scripting?

When learning any technical skill, our primary driver is almost always practical utility. From a job perspective, learning Shell scripting improves our work efficiency and productivity, allowing us to accomplish more in less time.

Many people argue that Shell scripting belongs to operations (Ops/SRE) and should be left to DevOps engineers, claiming backend developers have no need to learn it. This view is fundamentally mistaken. While our required depth of mastery is understandably lower than that of dedicated Linux system administrators, Shell scripting remains an indispensable baseline skill for backend developers!

Currently, the most popular languages for automation under Linux are Shell and Python.

Between the two, Shell is virtually mandatory for IT enterprises, especially in operational monitoring, rapid business deployment, service lifecycle control (start/stop/restart), data backup and processing, and log analysis. Python is better suited for complex business logic, developing full-fledged operations tooling, or building web-accessible interfaces. Shell is a command interpreter that interprets and executes commands and utilities entered by the user, providing an interactive, immediate dialog mode.

Furthermore, familiarity with Shell scripting is a standard hiring requirement for backend engineers across leading tech companies. The image below illustrates requirements for Shell scripting from several notable internet enterprises.

![Shell scripting requirements at major tech companies](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/shell/60190220-a676e313.png)

### What Is a Shell?

**A Shell is a command language interpreter for Linux/Unix systems**, acting as the bridge between users and the operating system kernel, receiving user commands and dispatching the appropriate programs.

**Shell scripting** is the process of combining commands, control flow structures (`if`/`for`/`while`), variables, and functions through a Shell interpreter (such as bash) into automated script files. A Shell is both an interactive command interpreter and a complete programming language (supporting variables, arrays, functions, control flow, pipelines, and redirection).

**Common Shell Types**:

- **bash** (Bourne Again Shell): The default Shell on most Linux systems and the most widely used.
- **sh** (Bourne Shell): The traditional Unix Shell, standardized by POSIX.
- **zsh**: A highly extensible, feature-rich interactive Shell.
- **dash**: A lightweight, fast POSIX-compliant Shell; `/bin/sh` on Ubuntu points to dash by default.
- **csh/tcsh**: C-syntax styled Shells.

### "Hello World" in Shell Scripting

The first thing you do when learning any programming language is outputting "Hello World"! Below is the step-by-step process from file creation to execution.

(1) Create a new file `helloworld.sh`: `touch helloworld.sh`. The extension `.sh` stands for Shell (extensions do not dictate execution in Linux, but provide clarity; if you write a script in PHP, you would name it `.php`).

(2) Grant executable permissions: `chmod +x helloworld.sh`.

(3) Edit the file with Vim: `vim helloworld.sh` (Vim file ------> Normal mode ------> Press `i` to enter Insert mode ------> Edit text ------> Press `Esc` for Normal mode ------> Type `:wq` to write and quit).

The content of `helloworld.sh`:

```shell
#!/bin/bash
set -euo pipefail  # Strict mode: exit on error, error on undefined vars, fail pipeline on error
# First shell program; echo is the standard Linux output command
echo "helloworld!"
```

In Shell, the `#` character indicates a comment. **The first line of a Shell script is special: it typically begins with `#!` (shebang) to specify the interpreter to invoke. In Linux, besides bash, there are zsh, dash, and more... but bash remains the most ubiquitous.**

(4) Run the script: `./helloworld.sh`. (Note: you must type `./helloworld.sh`, not just `helloworld.sh`. Just like running any other binary executable, typing `helloworld.sh` alone makes Linux search the directories in `$PATH`, such as `/bin`, `/sbin`, `/usr/bin`, and `/usr/sbin`. Your current directory is usually not in `$PATH`, so typing `helloworld.sh` will report "command not found"; `./helloworld.sh` explicitly instructs the system to look inside the current working directory).

![Hello World output in Shell scripting](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/shell/55296212-513db469.png)

## Shell Variables

### Introduction to Variables in Shell Scripting

**Shell scripting generally categorizes variables into three kinds:**

1. **Custom Variables (Local Variables)**: By default, valid only within the current Shell process; **child processes cannot access them**. To pass them down to child processes, you must export them as environment variables using `export`.
2. **Environment Variables**: Such as `PATH`, `HOME`, etc., inherited by child processes. Use the `env` command to list all environment variables, or `set` to list all variables (including environment and local variables).
3. **Special Shell Variables**: Predefined variables set by the Shell (such as `$?`, `$$`, `$!`, etc.) to store process states, parameters, and exit statuses.

**Common Environment Variables:**

> `PATH`: Defines the list of directories the Shell searches for executable commands or programs.
> `HOME`: The current user's home directory.
> `HISTSIZE`: Maximum number of commands stored in command history.
> `LOGNAME`: Login username of the current user.
> `HOSTNAME`: The hostname of the machine.
> `SHELL`: The current user's default Shell interpreter.
> `LANGUAGE`: Language localization variable.
> `MAIL`: Location of the current user's system mailbox.
> `PS1`: Primary command prompt string (typically `#` for root and `$` for standard users).

**Using Predefined Linux Environment Variables:**

For instance, to view the current user's home directory: `echo $HOME`. To inspect the current Shell interpreter: `echo $SHELL`. As you can see, usage is straightforward.

**Using Custom Variables:**

```shell
#!/bin/bash
# Define custom variable hello
hello="hello world"
echo $hello
echo  "helloworld!"
```

![Output of using custom variables](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/shell/19835037-f8f3a674.png)

**Naming Rules for Shell Variables:**

- Names may contain only English letters, digits, and underscores (`_`). The first character cannot be a number, but can be an underscore.
- There must be no spaces around the assignment operator `=`, and spaces within names are forbidden.
- Punctuation marks cannot be used.
- Reserved keywords in bash cannot be used as variable names (check keywords with `help`).

### Getting Started with Shell Strings

Strings are the most common and versatile data type in Shell scripting (outside numbers and strings, there are few built-in scalar types). Strings can be enclosed in single quotes or double quotes, unlike Java.

Inside single quotes, all special characters (such as `$`, backticks, `\`, etc.) lose their special meaning and are treated purely as literal characters.

Inside double quotes, the following characters retain their special meanings:

- `$`: Variable expansion (`$var`) and command substitution (`$(cmd)` or `` `cmd` ``)
- `\`: Escape character
- `` ` `` or `$()`: Command substitution (the `$()` syntax is strongly recommended)
- `!`: History expansion (enabled by default only in interactive Shells)
- `${}`: Parameter expansion

**Note**: Strings in single quotes are **strictly literal**, while strings in double quotes undergo variable and command substitution.

**Single-Quoted Strings:**

```shell
#!/bin/bash
name='SnailClimb'
hello='Hello, I am $name!'
echo $hello
```

Output:

```plain
Hello, I am $name!
```

**Double-Quoted Strings:**

```shell
#!/bin/bash
name='SnailClimb'
hello="Hello, I am $name!"
echo $hello
```

Output:

```plain
Hello, I am SnailClimb!
```

### Common Shell String Operations

**String Concatenation:**

```shell
#!/bin/bash
name="SnailClimb"
# Concatenation using double quotes
greeting="hello, "$name" !"
greeting_1="hello, ${name} !"
echo $greeting  $greeting_1
# Concatenation using single quotes
greeting_2='hello, '$name' !'
greeting_3='hello, ${name} !'
echo $greeting_2  $greeting_3
```

Output:

![Shell string concatenation command output](/media/jg/ext/oss.javaguide.cn/javaguide/cs-basics/shell/51148933-18fe26ea.png)

**Getting String Length:**

```shell
#!/bin/bash
# Get string length
name="SnailClimb"
# First method (recommended): bash built-in
echo ${#name}  # Outputs 10
# Second method: external command (poorer performance)
expr length "$name"
```

Output:

```plain
10
10
```

**Notes**:

- Prefer `${#var}`, as it is a bash built-in with superior performance.
- `expr` is an external utility requiring a process fork, carrying noticeable overhead.
- **`expr length` is a GNU extension**, not a POSIX standard. It may fail on macOS BSD expr or other Unix systems.
- For maximum portability, rely on `${#var}` or `expr "$var" : '.*'` (POSIX compliant).

When using the `expr` command, spaces are mandatory around operators in expressions:

```shell
expr 5+6       # Outputs literal 5+6 (missing spaces)
expr 5 + 6     # Outputs 11 (with spaces)
# Prefer bash arithmetic expansion:
echo $((5 + 6))  # Outputs 11
```

Certain operators must also be escaped with `\`:

```shell
expr 5 * 6       # Syntax error (unescaped wildcard)
expr 5 \* 6      # Outputs 30 (properly escaped)
```

**Substring Extraction:**

Simple substring slicing:

```shell
# Extract 10 characters starting from index 0 (0-indexed)
str="SnailClimb is a great man"
echo ${str:0:10} # Outputs: SnailClimb
```

Pattern-based substring stripping:

```shell
#!/bin/bash
# author: amau

var="https://www.runoob.com/linux/linux-shell-variable.html"
# % removes the shortest match from the end
# %% removes the longest match from the end
# # removes the shortest match from the beginning
# ## removes the longest match from the beginning
# Note: * is a wildcard matching any number of arbitrary characters
s1=${var%%t*} # h
s2=${var%t*}  # https://www.runoob.com/linux/linux-shell-variable.h
s3=${var%%.*} # https://www
s4=${var#*/}  # /www.runoob.com/linux/linux-shell-variable.html
s5=${var##*/} # linux-shell-variable.html
```

### Shell Arrays

**bash 2.0+** supports one-dimensional arrays (multidimensional arrays are not supported), with no preset limit on array size.

**Important Note**: Arrays are a **non-POSIX extension** in bash; pure POSIX sh (like dash) does not support arrays. If you must write strictly portable scripts, avoid arrays.

The following script demonstrates basic array operations: creation, length calculation, accessing/deleting specific elements, unsetting the entire array, and iteration.

```shell
#!/bin/bash
array=(1 2 3 4 5);
# Get array length
length=${#array[@]}
# or
length2=${#array[*]}
# Print array length
echo $length # Outputs: 5
echo $length2 # Outputs: 5
# Print 3rd element
echo ${array[2]} # Outputs: 3
unset 'array[1]' # Delete element at index 1 (the second element)
for i in "${array[@]}"; do echo "$i"; done # Iterate: outputs 1 3 4 5
unset array; # Delete entire array
for i in "${array[@]}"; do echo "$i"; done # Iterate: empty array, outputs nothing
```

**Important Note: Array Index Holes (Sparse Arrays)**:

When you delete an element using `unset array[1]`, the array becomes sparse with an **index hole**:

```shell
#!/bin/bash
array=(1 2 3 4 5)
echo "Before deletion: ${array[@]}"  # Outputs: 1 2 3 4 5
echo "Value at index 1: ${array[1]}"  # Outputs: 2

unset array[1]  # Delete element at index 1
echo "After deletion: ${array[@]}"   # Outputs: 1 3 4 5
echo "Value at index 1: ${array[1]}"  # Outputs: (empty)
echo "Value at index 2: ${array[2]}"  # Outputs: 3 (index 2 remains intact)

# Indices are no longer contiguous when iterating
for index in "${!array[@]}"; do
    echo "index[$index] = ${array[$index]}"
done
# Outputs:
# index[0] = 1
# index[2] = 3
# index[3] = 4
# index[4] = 5
```

**Note**: After deletion, accessing `${array[1]}` returns an empty value. When iterating over array keys, use `"${!array[@]}"` to retrieve valid indices, or use `"${array[@]}"` to iterate over values directly.

## Basic Shell Operators

Shell scripting supports several operator families:

- Arithmetic Operators
- Relational Operators
- Logical Operators
- Boolean Operators
- String Operators
- File Test Operators

### Arithmetic Operators

| **Operator** | **Description** | **Example** |
| --- | --- | --- |
| **+** | Addition | `expr $a + $b` |
| **-** | Subtraction | `expr $a - $b` |
| **\*** | Multiplication | `expr $a \* $b` (asterisk must be escaped) |
| **/** | Division | `expr $b / $a` |
| **%** | Modulo / Remainder | `expr $b % $a` |
| **=** | Assignment | `a=$b` assigns value of b to a |
| **==** | Equality | `[ "$a" == "$b" ]` string comparison, returns true if identical |
| **!=** | Inequality | `[ "$a" != "$b" ]` string comparison, returns true if different |

**Prefer Bash Built-in Arithmetic Expansion**:

```shell
#!/bin/bash
a=3; b=3
val=$((a + b))  # bash arithmetic expansion (recommended)
# Outputs: Total value: 6
echo "Total value: $val"
```

**Notes**:

- `$((...))` is a bash built-in feature avoiding subshell/process forks, offering superior performance.
- **Do not recommend** `expr` (forks a process, requires spaces around operators).
- **Do not recommend** backticks `` `...` `` (deprecated); use `$(...)` syntax instead.

**For POSIX sh compatibility**, you can use:

```shell
val=$(expr "$a" + "$b")  # POSIX compliant, but lower performance
```

### Relational Operators

Relational operators only support numbers (or strings whose values are numeric).

| **Operator** | **Description** | **English Mnemonic** |
| --- | --- | --- |
| **-eq** | Checks if two numbers are **equal** | equal |
| **-ne** | Checks if two numbers are **not equal** | not equal |
| **-gt** | Checks if left operand is **greater than** right | greater than |
| **-lt** | Checks if left operand is **less than** right | less than |
| **-ge** | Checks if left operand is **greater than or equal to** right | greater equal |
| **-le** | Checks if left operand is **less than or equal to** right | less equal |

A simple demonstration: if score is 100 output A, otherwise output B.

```shell
#!/bin/bash
score=90;
maxscore=100;
if [[ $score -eq $maxscore ]]
then
   echo "A"
else
   echo "B"
fi
```

Output:

```plain
B
```

### Logical Operators

| **Operator** | **Description** | **Example** |
| --- | --- | --- |
| **&&** | Logical **AND** | `[[ $a -lt 100 && $b -gt 100 ]]` (true only if both are true) |
| **\|\|** | Logical **OR** | `[[ $a -lt 100 \|\| $b -gt 100 ]]` (true if either is true) |

**Logical operations in arithmetic expansions**:

```shell
#!/bin/bash
a=$(( 1 && 0 ))
# Outputs: 0; logical AND yields 1 only when both operands are non-zero
echo $a;
```

**Command Short-Circuit Execution (Widely Used in Production)**:

In automation and CI/CD pipelines, `&&` and `||` are frequently used to control command execution chains through **short-circuit evaluation**:

```shell
#!/bin/bash
set -euo pipefail

# &&: Executes second command only if first command succeeds (exit code 0)
mkdir -p "/tmp/app_data" && echo "Directory ready"

# ||: Executes second command only if first command fails (non-zero exit code)
mkdir -p "/tmp/app_data" || echo "Directory creation failed"

# Combined chaining: typical defensive pattern in production
mkdir -p "/tmp/app_data" && echo "Directory ready" || exit 1

# Practical examples:
# 1. Delete file only if it exists
[ -f "/tmp/old_file.log" ] && rm "/tmp/old_file.log"

# 2. Output error message and exit on failure
cd /app/config || { echo "Cannot enter config directory"; exit 1; }

# 3. Conditional execution
command1 && command2 || command3
# ⚠️ Warning: This pattern has a known trap!
# - When command1 succeeds, command2 executes
# - When command1 fails, command3 executes
# - BUT if command1 succeeds and command2 subsequently FAILS, command3 WILL EXECUTE!
#
# ✅ Safer construct (recommended):
if command1; then
    command2
else
    command3
fi
#
# Alternatively, only use && || when you are positive command2 cannot fail
```

**Key Takeaways**:

- Short-circuit execution depends on the command's **Exit Code**: 0 indicates success, non-zero indicates failure.
- This differs from `&&` and `||` inside `[[ ]]`, which perform boolean condition tests.
- Beware the trap in `command1 && command2 || command3`: if `command1` succeeds but `command2` fails, `command3` executes anyway.
- In production scripts, favor explicit `if-then-else` blocks for clarity and safety.

### Boolean Operators

| **Operator** | **Description** | **Example** |
| --- | --- | --- |
| **!** | Inverts expression truth value. Returns false if true, true if false. | `[ ! false ]` returns false, because `false` is evaluated as a non-empty string. |
| **-o** | Logical OR in single brackets `[ ]`. Returns true if either is true. | `[ "$a" -lt 20 -o "$b" -gt 100 ]` returns true. |
| **-a** | Logical AND in single brackets `[ ]`. Returns true only if both are true. | `[ "$a" -lt 20 -a "$b" -gt 100 ]` returns false. |

### String Operators

| **Operator** | **Description** | **Example** |
| --- | --- | --- |
| **=** | Checks if two strings are **equal** | `[ "$a" = "$b" ]` |
| **!=** | Checks if two strings are **not equal** | `[ "$a" != "$b" ]` |
| **-z** | Checks if string length is **zero** (`-z`) | `[ -z "$a" ]` returns true if empty |
| **-n** | Checks if string length is **non-zero** (`-n`) | `[ -n "$a" ]` returns true if not empty |
| **str** | Directly tests if string is non-empty | `[ "$a" ]` returns true if not empty |

Simple example:

```shell
#!/bin/bash
a="abc";
b="efg";
if [[ "$a" = "$b" ]]
then
   echo "a equals b"
else
   echo "a does not equal b"
fi
```

Output:

```plain
a does not equal b
```

### File Test Operators

Used to inspect various attributes of Unix/Linux files (such as existence, permissions, and file types).

- **Existence and Type Tests:**
  - **-e file**: Returns true if file (including directories) exists.
  - **-f file**: Returns true if regular file (neither a directory nor a device node).
  - **-d file**: Returns true if file is a directory.
  - **-s file**: Returns true if file is non-empty (size > 0 bytes).
  - **-b / -c / -p**: Test whether file is a block device, character device, or named pipe (FIFO) respectively.
- **Permission Tests:**
  - **-r file**: Returns true if file is readable.
  - **-w file**: Returns true if file is writable.
  - **-x file**: Returns true if file is executable.
- **Special Attribute Tests:**
  - **-u / -g / -k**: Test whether file has SUID, SGID, or Sticky Bit set respectively.

Usage is straightforward: given `file="/usr/learnshell/test.sh"`, to check if it is readable write `if [ -r "$file" ]`; to check if writable write `[ -w "$file" ]`.

## Shell Control Flow

### `if` Conditional Statements

A basic example demonstrating `if`, `elif`, and `else`:

```shell
#!/bin/bash
a=3;
b=9;
if [[ $a -eq $b ]]
then
   echo "a equals b"
elif [[ $a -gt $b ]]
then
   echo "a is greater than b"
else
   echo "a is less than b"
fi
```

Output:

```plain
a is less than b
```

**Handling No-Op / Empty Blocks**: Shell allows using `:` (colon command, a built-in no-op) or the `true` command:

```shell
if [[ condition ]]; then
    :  # No-op (does nothing)
fi

# or
if [[ condition ]]; then
    true  # No-op
fi
```

This is particularly useful as a placeholder inside loops or stub branches.

### `for` Loops

The following three examples illustrate basic usage of `for` loops.

**Iterate over a static list:**

```shell
for loop in 1 2 3 4 5
do
    echo "The value is: $loop"
done
```

**Generate 10 random numbers:**

```shell
#!/bin/bash
for i in {0..9};
do
   echo $RANDOM;
done
```

**Loop from 1 to 5 (C-style syntax):**

Variables inside arithmetic `(())` do not need a prefix `$`:

```shell
#!/bin/bash
length=5
for((i=1;i<=length;i++));do
    echo $i;
done;
```

### `while` Loops

**Basic `while` loop:**

```shell
#!/bin/bash
int=1
while (( int <= 5 ))  # Variables inside arithmetic context do not need $
do
    echo $int
    (( int++ ))  # Prefer (( )) over let
done
```

**Reading standard input dynamically:**

```shell
echo 'Press <CTRL-D> to exit'
echo -n 'Enter your favorite movie: '
while read -r FILM  # -r option prevents backslash escape interpretation
do
    echo "Yes! $FILM is a great movie"
done
```

Output:

```plain
Press <CTRL-D> to exit
Enter your favorite movie: Transformers
Yes! Transformers is a great movie
```

**Infinite Loop:**

```shell
while true
do
    command
done
```

## Shell Functions

### Function Without Parameters and Return Value

```shell
#!/bin/bash
hello(){
    echo "This is my first shell function!"
}
echo "-----Function execution starts-----"
hello
echo "-----Function execution finished-----"
```

Output:

```plain
-----Function execution starts-----
This is my first shell function!
-----Function execution finished-----
```

### Functions with Return Values

**Adding two numbers prompted from user input:**

```shell
#!/bin/bash
set -euo pipefail

funWithReturn(){
    local aNum
    local anotherNum
    echo "Enter first number: "
    read -r aNum
    echo "Enter second number: "
    read -r anotherNum
    echo "The two numbers are $aNum and $anotherNum !"
    result=$((aNum + anotherNum))
}
result=0
funWithReturn
echo "The sum of the two numbers is $result"
```

**Important Notes**:

- **`local` Keyword**: Restricts variable scope strictly to the function, preventing pollution of the global environment.
- **`read -r`**: The `-r` flag disables backslash escaping, improving safety.
- **Function Return Values**: In Shell, `return` sets an exit status code between 0 and 255; it is unsuitable for returning computed calculation results. Use standard output (`echo`) or assigned variables to pass computational output.

**Why Use `local`?**

- In complex scripts or modular setups sourcing external files, non-local variables can be accidentally overwritten.
- Global variable pollution leads to subtle configuration drifts and logical security bypasses.
- Using `local` represents standard best practice in shell scripting, mirroring local scope in modern languages.

Output:

```plain
Enter first number: 
1
Enter second number: 
2
The two numbers are 1 and 2 !
The sum of the two numbers is 3
```

### Functions with Arguments

```shell
#!/bin/bash
funWithParam(){
    echo "First parameter is $1"
    echo "Second parameter is $2"
    echo "Script name is $0"
    echo "Tenth parameter is ${10}"   # Note: must use ${n} when parameter index >= 10
    echo "Eleventh parameter is ${11}"
    echo "Total parameter count is $#"
    echo "All parameters as string: $*"   # Merged into a single string
    echo "All parameters as array: $@"    # Kept as distinct arguments (recommended)
}
funWithParam 1 2 3 4 5 6 7 8 9 34 73
```

Output:

```plain
First parameter is 1
Second parameter is 2
Script name is ./script.sh
Tenth parameter is 34
Eleventh parameter is 73
Total parameter count is 11
All parameters as string: 1 2 3 4 5 6 7 8 9 34 73
All parameters as array: 1 2 3 4 5 6 7 8 9 34 73
```

**Key Takeaways**:

- **Positional parameters `$n` where `n >= 10` MUST use `${n}` syntax**.
- `$10` without braces is parsed as `$1` followed by literal `0`, rather than the 10th argument.
- `$0` refers to the script or function invocation name.
- `$#` yields the total count of arguments passed.

**Core Difference Between `$*` and `$@`**:

| Expression | Unquoted | Enclosed in Double Quotes (`""`) |
| --- | --- | --- |
| `$*` | Expands to all parameters split by IFS | Expands to a **single string** with all parameters concatenated |
| `$@` | Expands to all parameters split by IFS | Expands to **individual parameters** (each argument remains separate) |

**Comparative Example**:

```shell
#!/bin/bash
test_args() {
    echo "--- Using \$* (unquoted) ---"
    for arg in $*; do
        echo "arg: [$arg]"
    done

    echo -e "\n--- Using \$@ (unquoted) ---"
    for arg in $@; do
        echo "arg: [$arg]"
    done

    echo -e "\n--- Using \"\$*\" (double-quoted) ---"
    for arg in "$*"; do
        echo "arg: [$arg]"
    done

    echo -e "\n--- Using \"\$@\" (double-quoted, recommended) ---"
    for arg in "$@"; do
        echo "arg: [$arg]"
    done
}

# Invoke function passing parameters containing spaces
test_args "hello world" "foo bar"
```

**Output**:

```plain
--- Using $* (unquoted) ---
arg: [hello]
arg: [world]
arg: [foo]
arg: [bar]

--- Using $@ (unquoted) ---
arg: [hello]
arg: [world]
arg: [foo]
arg: [bar]

--- Using "$*" (double-quoted) ---
arg: [hello world foo bar]  # All parameters merged into one string

--- Using "$@" (double-quoted, recommended) ---
arg: [hello world]  # Each parameter preserved individually
arg: [foo bar]
```

**Conclusion**: When passing parameters through, **always use `"$@"`** to preserve individual argument boundaries, particularly when arguments contain spaces.

## Shell Scripting Best Practices

After mastering the syntax basics, adopting solid engineering practices helps you author safer, more robust scripts.

### Script Engineering Standards

**1. Shebang Standards**:

```shell
#!/usr/bin/env bash
# Look up bash through PATH
set -euo pipefail
```

**Two Shebang Styles**:

- `#!/bin/bash`: Direct path; appropriate for fixed server environments with known paths.
- `#!/usr/bin/env bash`: Discovers bash via `env`; more portable across Linux, macOS, and BSD systems.

**Style Selection in This Article**:

- Introductory tutorials use `#!/bin/bash` for simplicity.
- Production-grade examples use `#!/usr/bin/env bash` for maximum portability.

**2. Variable Quoting**:

```shell
# Always wrap variables in double quotes
echo "$var"     # Recommended
echo $var       # Risks word splitting and unintended globbing
```

**3. Use shellcheck**:

```bash
shellcheck your_script.sh  # Static analysis tool to identify common bugs and anti-patterns
```

**4. Recommended Modern Syntax**:

- Use `[[ ]]` instead of legacy `[ ]` (safer, supports regex and pattern matching).
- Use `$((...))` instead of `expr` (faster, cleaner).
- Use `$(...)` instead of backticks (nestable, clearer syntax).
- Use `${n}` for positional parameters where `n >= 10`.

### How `pipefail` Works

By default, the exit status of a pipeline command is solely determined by the final command in the pipeline. When `pipefail` is enabled, the pipeline's return value reflects the exit status of the last command that returned a non-zero exit code. This prevents silent intermediate errors from going unnoticed.

**Comparison Example**:

```shell
# Default mode (dangerous)
cat huge_file.txt | grep "pattern" | head -n 10
# Even if cat fails because the file does not exist, as long as head succeeds, the exit status is 0!

# pipefail mode (safe)
set -o pipefail
cat huge_file.txt | grep "pattern" | head -n 10
# If cat fails, the pipeline immediately returns an error status instead of silently succeeding
```

## Before Putting Shell Scripts into Production

Getting basic syntax right is only the first step. When scripts run in cron jobs, CI/CD pipelines, or production hosts, they must handle unexpected exits, temporary file hygiene, network timeouts, and background task statuses. Let us explore these through several concrete examples.

`set -u` and `set -o pipefail` behave relatively predictably; `set -e` has many subtle edge cases across conditional evaluations, subshells, functions, and command substitutions. Treat `set -euo pipefail` as a baseline for new scripts, but never use it to replace explicit `if ! command; then ... fi` error handling. Always wrap variables in double quotes, and enforce `local` for all variables inside functions.

### Enforcing Global Timeouts for Network Requests

Any network request should bound both the initial connection phase and the total data transfer duration. Retries must reside at a single layer: if an outer loop and `curl --retry` are enabled simultaneously, total attempts multiply exponentially, making execution time unpredictable. The function below centralizes retry control in an outer loop, adding a 0–2 second random jitter after each failure:

```shell
#!/usr/bin/env bash

retry_request() {
    local url="$1"
    local max_attempts=5
    local attempt=1
    local delay
    local jitter

    while (( attempt <= max_attempts )); do
        if curl --fail --silent --show-error \
                --connect-timeout 3 \
                --max-time 10 \
                "$url"; then
            return 0
        fi

        if (( attempt == max_attempts )); then
            break
        fi

        delay=$((1 << (attempt - 1)))
        (( delay > 16 )) && delay=16
        jitter=$((RANDOM % 3))
        delay=$((delay + jitter))
        printf 'Attempt %d failed, retrying in %d seconds\n' "$attempt" "$delay" >&2
        sleep "$delay"
        ((attempt += 1))
    done

    return 1
}

command -v curl >/dev/null 2>&1 || {
    echo "curl is not installed" >&2
    exit 1
}

[[ $# -eq 1 ]] || {
    echo "Usage: $0 <url>" >&2
    exit 1
}

retry_request "$1" || {
    echo "Request failed" >&2
    exit 1
}
```

In production, determine retry eligibility based on API semantics. Non-idempotent write requests, authentication failures, and bad parameter payloads should generally not be retried automatically.

### Temporary Files and Mutual Exclusion Locks

Avoid predictable paths like `/tmp/data_$$`. `mktemp` creates files or directories atomically, and paired with `trap`, ensures automatic cleanup upon normal termination or reception of standard signals:

```shell
#!/usr/bin/env bash

temp_dir=$(mktemp -d "${TMPDIR:-/tmp}/myapp.XXXXXXXX") || {
    echo "Failed to create temporary directory" >&2
    exit 1
}
cleanup() {
    rm -rf -- "$temp_dir"
}
trap cleanup EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

temp_file="$temp_dir/result.txt"
printf 'temporary data\n' > "$temp_file"
cat "$temp_file"
```

To prevent concurrent execution of the same script on a single host, use `flock` on an application-managed lock file:

```shell
exec 9>/var/lock/myapp.lock || exit 1
flock -n 9 || {
    echo "Script is already running" >&2
    exit 1
}
```

`flock` is an advisory lock; other processes can technically choose to ignore it. While the Linux NFS client can emulate it as a whole-file `fcntl` lock, real behavior is contingent upon kernel versions, server implementation, and mount options like `local_lock`. If lock files reside on network filesystems, verify behavior with two independent clients in the target deployment environment. Similarly, distributed locking across machines cannot simply be solved with a single Redis `SET NX PX`: real implementations must handle unique tokens, conditional Lua script releases, lease renewals, and partition failure modes.

### Collecting Exit Codes from Background Tasks

A bare `wait` without arguments waits for all background processes, but Bash returns 0, failing to indicate if any individual background job crashed. The script below counts bytes across multiple files concurrently, collecting each child process's status:

```shell
#!/usr/bin/env bash
set -u

pids=()
for file in "$@"; do
    wc -c -- "$file" &
    pids+=("$!")
done

exit_code=0
for pid in "${pids[@]}"; do
    if ! wait "$pid"; then
        echo "Background task $pid failed" >&2
        exit_code=1
    fi
done

exit "$exit_code"
```

Relying solely on `while wait -n; do ...; done` is also incomplete: when any task fails, `wait -n` returns non-zero, immediately terminating the loop and abandoning tracking of remaining processes.

### Common Misconceptions

Do not permanently redirect both stdout and stderr of entire commands to `/dev/null`; otherwise, failures leave only an exit code with zero diagnostic context. Only silence output confirmed to be redundant, and ensure error messages are routed to logs or preserved in standard error. When scripts depend on external commands like `curl` or `jq`, verify their availability up front with `command -v`; enable `set -o pipefail` whenever pipelines need to detect failures in intermediate stages.

### Pre-Deployment Verification

Testing should directly test the script's real dependencies. Network scripts must validate connection drops, timeouts, and non-retryable HTTP error codes; concurrent scripts must verify each child's exit status; scripts generating temporary resources must verify cleanup upon normal exits and signal interruptions. Fault injection that alters firewall rules, system time, or mount states should be tailored to isolated sandbox environments rather than pasted blindly into production.

## Summary

Shell excels at chaining existing command-line tools into lightweight automated workflows. Start by mastering variable expansion, conditions, loops, functions, and exit statuses, then supplement with timeouts, cleanup traps, and defensive error handling based on network, file, and concurrency needs.

### Core Knowledge Review

| Knowledge Module | Key Takeaway |
| --- | --- |
| **Variables** | Distinguish local, environment, and special variables; use `local` to avoid global pollution; always double-quote variables |
| **Strings** | Prefer double quotes; understand single vs. double quote semantics; use `${#var}` for string length |
| **Arrays** | bash 2.0+ supports 1D arrays (non-POSIX); beware of sparse index holes upon deletion |
| **Operators** | Prefer `$((...))` for arithmetic; `[[ ]]` is strictly safer and more capable than `[ ]` |
| **Control Flow** | Use `[[ ]]` for conditional testing; avoid the `command1 && command2 \|\| command3` trap |
| **Functions** | Restrict variable scope with `local`; `return` can only return exit codes from 0 to 255 |
| **Command Substitution** | Use `$(...)` instead of backticks; use `read -r` for safe input parsing |

### Learning Advice

Start with small tasks like log filtering, batch file renaming, and data aggregation. After writing, validate syntax with `bash -n`, then run ShellCheck to catch unquoted variables and redirection pitfalls. As scripts grow to manage background services or daemons, expand your toolkit with signals, job control, `sed`, `awk`, and `grep`. Once a script exceeds several hundred lines, requires complex data structures, or needs sophisticated exception recovery, a general-purpose language like Python is typically easier to maintain.

### Reference Resources

- **Official Documentation**: Bash Reference Manual (GNU)
- **Static Analysis**: ShellCheck - Shell Script Analysis Tool
- **Coding Standards**: Google Shell Style Guide
- **Common Pitfalls**: Bash Pitfalls (http://mywiki.wooledge.org/BashPitfalls)
