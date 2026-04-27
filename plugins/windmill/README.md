# Windmill Plugin for Claude Code

Connect [Claude Code](https://claude.com/claude-code) to [Windmill](https://gowindmill.com) for performance reviews, feedback, 1:1s, pulse surveys, and more. The plugin bundles Windmill's MCP server with skills that guide Claude through common Windmill workflows.

Built for HR/People Ops, managers, and anyone who uses Windmill day-to-day and wants to work with their Windmill data from inside Claude Code.

## What's included

- **MCP connection** to Windmill's MCP server — gives Claude access to all Windmill tools and data
- **Skills** that guide Claude through Windmill workflows:
  - **Collect Feedback** — give feedback to colleagues with proper formatting, shoutouts, and visibility handling
  - **Request Feedback** — request feedback from colleagues and manage existing requests
  - **Manage Notes** — create, search, update, and delete private notes about colleagues
  - **Manage 1:1s** — create 1:1s, update shared notes pages, and configure notification preferences
  - **Create Pulse** — create AI-driven conversational surveys for your team
  - **Manage Pulse** — schedule, trigger, pause, and monitor existing pulses

## Install

In Claude Code, add the marketplace and install the plugin:

```
/plugin marketplace add windmill-dev/windmill-plugin
/plugin install windmill@windmill
```

Then run `/reload-plugins` to activate it, and `/mcp` to confirm `plugin:windmill:windmill` appears in the list.

For a full walkthrough — including Claude Desktop and Codex setup — see the [Windmill MCP docs](https://help.gowindmill.com/features/mcp).

## Authentication and permissions

The first time Claude calls a Windmill tool, your browser will open for you to sign in with your Windmill account via OAuth. Once authenticated, the plugin acts as you — it has the same read and write access you have in the Windmill Dashboard. If you can't see something in the dashboard, you can't access it via the plugin either.

There's no admin setup. Each person installs the plugin and authenticates individually with their own Windmill account.

## Usage examples

Once connected, you can ask Claude to work with your Windmill data. A few examples across what the plugin supports:

- **1:1 prep:** "Add 'discuss Q2 goals' to my 1:1 agenda with Alex"
- **Pulse surveys:** "Create a pulse asking the engineering team about workload"
- **Team recaps:** "What has the product team been up to recently?"
- **Personal notes:** "Show me my notes on Alex"
- **Feedback:** "Give a shoutout to the design team for the rebrand launch"

For the full range of what's possible, see [help.gowindmill.com/features/mcp](https://help.gowindmill.com/features/mcp).

## Privacy

The plugin sends workplace data — employees, 1:1s, feedback, notes, and other Windmill content you have access to — to Windmill's MCP server at `https://mcp.gowindmill.com/mcp`. See Windmill's [privacy policy](https://gowindmill.com/legal/privacy-policy) for how Windmill handles your data.

## Learn more

- [Windmill MCP docs](https://help.gowindmill.com/features/mcp)
- [gowindmill.com](https://gowindmill.com)
