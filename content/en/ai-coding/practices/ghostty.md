---
title: "A Better Terminal than iTerm2 for Claude Code/Codex: Why I Switched to Ghostty"
description: "Introduces Ghostty terminal installation, configuration file locations, fonts and themes, Starship prompt, split-pane shortcuts, Quick Terminal, Shell Integration, SSH, and troubleshooting—ideal for Claude Code and Codex CLI users building a fluid terminal workbench."
category: AI Coding Tips
tag:
  - Ghostty
  - Claude Code
  - Codex
  - Terminal Tools
head:
  - - meta
    - name: keywords
      content: Ghostty,Ghostty installation,Ghostty configuration,Ghostty tutorial,Claude Code terminal,Codex CLI,AI coding terminal,terminal tools,Starship,Shell Integration
lang: en
sourceRef: zh-ref/ai-coding/practices/ghostty.md
---

Hello, I'm Xiao G. I switched my primary terminal from iTerm2 to Ghostty three months ago.

The overall experience has been genuinely pleasant, and I'd like to share it in this article.

Ghostty is not the officially designated terminal for Claude Code, but it certainly surged in popularity alongside Claude Code. Boris Cherny, the creator of Claude Code, mentioned when discussing team habits that their engineering team is immensely fond of Ghostty.

![Boris Cherny mentions Claude Code team loves Ghostty](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/boris-ghostty-x-54173970.png)

I personally switched over after seeing that share, having grown increasingly tired of tinkering with iTerm2.

When running Claude Code or Codex CLI for extended periods, the terminal essentially transforms into a compact workbench: viewing Agent outputs on one side, while executing tests, inspecting logs, and managing Git on the other. iTerm2 can certainly achieve this, but getting it tuned comfortably typically demands considerable time configuring fonts, themes, keybindings, and window splits. The beauty of Ghostty is that it is remarkably usable right out of the box; subsequent adjustments merely entail minor personal tweaks.

Ghostty focuses squarely on doing one thing exceptionally well: being a great terminal emulator, without unnecessary gimmicks. It does not embed AI, nor does it attempt to be a server manager.

Of course, iTerm2, Warp, Kitty, and others are all excellent tools. I hope readers won't turn this into a tribal flame war; whichever tool feels most natural and ergonomic to you is what matters most!

![Ghostty official website homepage](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/ghostty-homepage-1fc7ec04.png)

## Installation

On macOS, use Homebrew directly:

```bash
brew install --cask ghostty
```

Alternatively, visit the official website to download the `.dmg` and drag it into Applications. The official macOS build is cryptographically signed and notarized by the Ghostty project; the Homebrew cask references this identical official `.dmg`.

Verify the installed version:

```bash
/Applications/Ghostty.app/Contents/MacOS/ghostty +version
```

If the CLI binary is already in your `PATH`:

```bash
ghostty +version
```

![Ghostty version check output](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/ghostty-version-f7543467.png)

> Version Note: The configuration in this article is calibrated against Ghostty 1.3.1 (1.3.x branch) on my machine. Ghostty updates rapidly; always cross-reference settings with `ghostty +show-config --default --docs` on your local installation. Ghostty 1.4.0 plans to introduce `ghostty +ssh`; the following sections retain the 1.3.x SSH approach. Users on 1.4+ should consult the [Ghostty SSH Documentation](https://ghostty.org/docs/features/ssh) rather than blindly copying legacy configurations.

Linux installation depends on your distribution. On Arch Linux, install directly via:

```bash
sudo pacman -S ghostty
```

For other distributions, consult the official installation documentation first. The Ghostty project distributes official prebuilt binaries primarily for macOS; Linux packages are largely maintained by distribution packagers or community members. Avoid executing untrusted installation scripts on work or corporate machines.

## Run with Defaults for a Day First

In reality, you don't need any custom configuration to start using it; defaults satisfy the vast majority of developer needs.

Ghostty bundles JetBrains Mono by default, equipped with Nerd Fonts glyph capabilities. Most users don't even need to configure fonts manually.

When starting out, resist the urge to paste hundreds of lines of configuration. Open it and use it as-is for a day, then iteratively tweak fonts, themes, window padding, opacity, clipboard behaviors, Shell Integration, and split shortcuts. The longer a terminal config grows, the harder debugging becomes; one of Ghostty's greatest merits is requiring minimal configuration.

## Where Are the Configuration Files?

Ghostty configurations follow a clean `key = value` format. The currently recommended filename is `config.ghostty`, though the legacy filename `config` remains supported. Common paths:

```text
~/.config/ghostty/config.ghostty
~/.config/ghostty/config
```

On macOS, it additionally reads:

```text
~/Library/Application Support/com.mitchellh.ghostty/config.ghostty
~/Library/Application Support/com.mitchellh.ghostty/config
```

If configurations exist in both locations, the macOS Application Support path loads later, overriding conflicting keys defined earlier. If a configuration change fails to take effect, check this priority first.

Common diagnostic commands:

```bash
ghostty +list-fonts
ghostty +list-themes
ghostty +list-keybinds --default
ghostty +validate-config
```

After modifying settings, reload config on macOS with `Cmd + Shift + ,`, or `Ctrl + Shift + ,` on Linux. Window-level properties like opacity may not hot-reload dynamically; if changes don't appear, restart Ghostty.

## My Minimal Configuration

Create the directory first:

```bash
mkdir -p ~/.config/ghostty
```

Edit the configuration file:

```bash
nano ~/.config/ghostty/config.ghostty
```

You can directly adopt this clean starter configuration:

```ini
# Fonts
font-family = "JetBrainsMono Nerd Font Mono"
font-size = 14
font-thicken = true
font-thicken-strength = 80
font-codepoint-map = U+2E80-U+9FFF,U+F900-U+FAFF,U+FF00-U+FFEF=PingFang SC

# Theme
theme = Catppuccin Mocha

# Window
window-padding-x = 12
window-padding-y = 10
window-save-state = always
background-opacity = 0.95
background-blur = 20

# Cursor and scrollback
cursor-style = bar
cursor-style-blink = true
scrollback-limit = 10000000
scrollbar = never

# Shell Integration
shell-integration = detect
shell-integration-features = cursor,sudo,title

# macOS
macos-option-as-alt = left
macos-titlebar-style = transparent
macos-titlebar-proxy-icon = hidden

# Splits
split-divider-color = #45475a
unfocused-split-opacity = 0.92

# Clipboard
copy-on-select = false
clipboard-paste-protection = true
clipboard-paste-bracketed-safe = true
```

The font specified here is JetBrainsMono Nerd Font Mono, primarily ensuring that Git branch symbols, Starship prompt glyphs, and Powerline icons render cleanly without placeholder squares. If not installed:

```bash
brew install --cask font-jetbrains-mono-nerd-font
```

For CJK characters, avoid simply appending `PingFang SC` indiscriminately as a secondary `font-family`. If a glyph is missing from the primary font, English text might fall back onto the Chinese font, creating awkward character spacing. `font-codepoint-map` delegates exclusively Chinese codepoint ranges to `PingFang SC`, which is far more stable.

`copy-on-select = false` reflects personal ergonomics. Ghostty defaults to copying selected text automatically—a behavior favored by many Linux users. On macOS, I prefer explicit `Cmd + C` to avoid accidentally overwriting clipboard buffers.

`clipboard-paste-protection = true` is strongly recommended. Pasting multiline shell commands copied from web pages should always prompt an intentional confirmation step.

Note that `scrollback-limit` is measured in bytes, not lines; `10000000` is approximately 10 MB, calculated independently per split pane and tab.

![Ghostty paired with Catppuccin Mocha, JetBrainsMono Nerd Font, and Starship](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/ghostty-terminal-demo-347f0be6.png)

## Themes

List all built-in themes:

```bash
ghostty +list-themes
```

Switching themes takes a single line:

```ini
theme = TokyoNight
```

I typically use:

```ini
theme = Catppuccin Mocha
```

To automatically match your system light/dark appearance:

```ini
theme = dark:Catppuccin Mocha,light:Catppuccin Latte
```

Ghostty bundles a generous selection of built-in themes. Custom themes are essentially configuration snippets loaded by Ghostty, mostly modifying palette colors; when downloading themes from unfamiliar sources, inspect them first to ensure they don't unexpectedly alter fonts, opacity, or keybindings.

## Starship (Optional)

Ghostty manages terminal windows, font rendering, themes, and terminal protocols; Starship manages the shell prompt.

To match prompt aesthetics with the Catppuccin palette, install it via:

```bash
brew install starship
```

Append to the bottom of `~/.zshrc`:

```bash
command -v starship >/dev/null && eval "$(starship init zsh)"
```

To inspect exactly which prompt modules Starship is rendering, run inside any Git repository:

```bash
starship explain
```

![Starship explain showing prompt paths, branch, and Git status](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/starship-explain-3220819f.png)

I advise against enabling every Starship module at the start. Working directory, Git branch, Git status, and command execution duration are plenty; add Kubernetes clusters, cloud credentials, or container runtimes only when needed. Prompt computations trigger on every Return key; overloaded information degrades rendering responsiveness.

## Splits and Essential Shortcuts

On macOS, master these foundational shortcuts first:

| Shortcut | Action |
| --- | --- |
| `Cmd + T` | New tab |
| `Cmd + W` | Close current terminal or split pane |
| `Cmd + D` | Split right |
| `Cmd + Shift + D` | Split down |
| `Cmd + [` / `Cmd + ]` | Cycle previous / next split pane |
| `Cmd + Option + Arrow Keys` | Navigate split panes by direction |
| `Cmd + Shift + Enter` | Toggle zoom current split pane |
| `Cmd + F` | Search scrollback history |
| `Cmd + Shift + ,` | Reload configuration |
| `Cmd + Shift + P` | Command palette |

When running Claude Code, a three-pane layout feels smoothest:

1. Press `Cmd + D` to split left and right.
2. Focus the right pane, then press `Cmd + Shift + D` to split top and bottom.
3. Run Claude Code on the left, execute tests on the top-right, and tail logs or Git status on the bottom-right.
4. If Claude's output is extensive, press `Cmd + Shift + Enter` to temporarily zoom into fullscreen.

This setup eliminates the need for tmux or juggling multiple scattered windows.

![Ghostty split running Claude Code, dev server, and logs](/media/jg/ext/oss.javaguide.cn/javaguide/ai/coding/ghostty-split-claude-code-130d93c9.png)

To customize keybindings, use this syntax:

```ini
keybind = trigger=action
```

For example:

```ini
keybind = cmd+shift+e=equalize_splits
keybind = cmd+shift+f=toggle_split_zoom
```

## Quick Terminal

Quick Terminal is a dropdown terminal that slides down from the top of the display. It is ideal for executing ephemeral commands, rather than serving as your primary all-day workbench.

Configuration:

```ini
quick-terminal-position = top
quick-terminal-screen = main
quick-terminal-autohide = true
quick-terminal-animation-duration = 0.15
keybind = global:ctrl+grave_accent=toggle_quick_terminal
```

Quick Terminal has no default keybinding; you must explicitly bind `toggle_quick_terminal`. The `global:` prefix is not supported across all environments: on macOS, Ghostty requires Accessibility permissions in System Settings; on Linux, Quick Terminal only supports Wayland compositors implementing `wlr-layer-shell-v1` (X11 is unsupported). Slide-in animations on Linux currently require KDE with KWin's "Sliding Popups" plugin enabled followed by a full Ghostty restart; environments like GNOME will not render animations even if `quick-terminal-animation-duration` is defined. If configuration is syntactically valid but the global hotkey doesn't trigger, verify display protocols, desktop environment support, system permissions, and shortcut conflicts.

Additionally, changing `quick-terminal-position` on macOS requires restarting Ghostty completely.

## Shell Integration

I keep this setting enabled:

```ini
shell-integration = detect
```

Ghostty injects integration scripts for zsh, fish, bash, nushell, and elvish. When active, new splits automatically inherit the current working directory; for instance, opening a split inside a project root keeps the new pane in that directory rather than reverting to `~`. Complex multiline prompts and window resizes experience fewer visual glitches, and scrollback history navigation can jump by prompt markers.

Two minor gotchas to watch for:

macOS's bundled `/bin/bash` is notoriously outdated; official documentation notes it lacks auto-injection support (default zsh users are unaffected). Second, manually switching shells inside Ghostty (e.g., launching `nix-shell`) may lose integration features, requiring manual sourcing of the integration script.

## Don't Rush to Configure SSH

Ghostty 1.3.x ships with custom terminfo and protocol extensions. When connecting to remote hosts lacking this terminfo, TUI tools like Neovim or htop may display visual artifacts.

If you only use SSH occasionally, leave it alone. If you encounter remote display glitches, consider:

```ini
shell-integration-features = cursor,title,ssh-env,ssh-terminfo
```

SSH environments are inherently heterogeneous; when things work cleanly, avoid adding extra wrapper layers.

Once Ghostty 1.4.0 is released, evaluate the native integration provided by `ghostty +ssh` before deciding whether to maintain legacy 1.3.x workarounds.

## Troubleshooting and FAQ

If configurations do not take effect, inspect both config directories first, then validate syntax:

```bash
ls -la ~/.config/ghostty
ls -la "$HOME/Library/Application Support/com.mitchellh.ghostty"
ghostty +validate-config
```

Some online examples use decorative headers like `=== Fonts ===`, which Ghostty rejects as syntax errors. Comments must strictly start with `# Fonts`.

If English character kerning looks unusual, verify whether font names resolve accurately:

```bash
ghostty +list-fonts | rg -i "JetBrains|Mono|Nerd"
```

If you configured `font-family = JetBrains Mono` but that exact family is not installed, Ghostty will fall back. Falling back to a CJK font easily degrades English kerning. Install the intended font or update the config to match the exact family name recognized by Ghostty.

Theme names must strictly match entries in `ghostty +list-themes`. For `Catppuccin Mocha`, write verbatim:

```ini
theme = Catppuccin Mocha
```

If opacity adjustments do not show, restart Ghostty completely. Another scenario is tools like Neovim or tmux drawing their own explicit background colors; Ghostty by default renders window backgrounds transparent, not guaranteeing cells with explicit background colors become transparent. To force those cells transparent as well, explore `background-opacity-cells`.

If selecting text overwrites your clipboard, disable it:

```ini
copy-on-select = false
```

If Quick Terminal's global hotkey does not respond, check three things: whether `global:` is prefixed, whether system permissions and display servers permit it, and whether another application intercepts the shortcut.

## Summary

If your only objective is an aesthetically pleasing terminal, iTerm2 can be themed and styled with transparency just as well. For me, Ghostty feels perceptibly lighter in native window management, default split ergonomics, clean human-readable configuration, and handling massive command outputs. This reflects personal hardware and usage patterns rather than an absolute universal benchmark.

I recommend running with default settings for a day first, adjusting fonts, themes, and keybindings only in response to concrete needs. Once split navigation feels second nature, decide whether Quick Terminal adds value to your workflow. You can also have a Coding Agent generate candidate configurations based on this guide, but verify your local Ghostty version, operating system, and existing keybinds prior to writing files to prevent overwriting personal shortcuts.
