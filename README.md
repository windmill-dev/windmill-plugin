# Windmill Plugin for Claude Code

Connect [Claude Code](https://claude.com/claude-code) to [Windmill](https://gowindmill.com) for performance reviews, feedback, 1:1s, pulse surveys, and more.

## What's included

This plugin bundles:

- **MCP connection** to Windmill's MCP server — gives Claude access to all Windmill tools and data
- **Skills** that guide Claude through Windmill workflows:
  - **Collect Feedback** — give feedback to colleagues with proper formatting, shoutouts, and visibility handling
  - **Request Feedback** — request feedback from colleagues and manage existing requests
  - **Manage Notes** — create, search, update, and delete private notes about colleagues
  - **Manage 1:1s** — create 1:1s, update shared notes pages, and configure notification preferences
  - **Create Pulse** — create AI-driven conversational surveys for your team
  - **Manage Pulse** — schedule, trigger, pause, and monitor existing pulses

## Install

### From the marketplace

```
/plugin marketplace add windmill-dev/windmill-plugin
/plugin install windmill@windmill
```

### Manual

```
claude --plugin-dir /path/to/windmill-plugin/plugins/windmill
```

## Authentication

The first time Claude uses a Windmill tool, you'll be prompted to authenticate via your browser using your Windmill account. All actions use your permissions — if you can't see something in the Windmill Dashboard, you can't access it via the plugin either.

## Learn more

- [Windmill MCP docs](https://help.gowindmill.com/features/mcp)
- [gowindmill.com](https://gowindmill.com)
