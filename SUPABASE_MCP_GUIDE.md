# Supabase MCP (Model Context Protocol) Setup Guide
### Connect Supabase to AI Agents (Claude, ChatGPT, Cursor, Antigravity, SuperMCP)

This repository is configured to connect **Supabase** with AI agents via the **Model Context Protocol (MCP)**. This enables AI assistants (Claude, ChatGPT, Cursor, Antigravity) to:
- 🔍 **Inspect and Query:** Read tables, records, schemas, and columns in real-time.
- ✍️ **Add & Edit Records:** Insert new school exhibits, update achievement records, and modify data dynamically.
- 🛠️ **Run SQL & Migrations:** Execute SQL queries and verify Row-Level Security (RLS) policies.
- 📦 **Manage Storage:** Inspect buckets and files directly from AI chat.

---

## Your Project Details
* **Project URL:** `https://khohlbyvnmmmdmyhusvg.supabase.co`
* **Project Reference ID:** `khohlbyvnmmmdmyhusvg`
* **Hosted MCP Endpoint:** `https://mcp.supabase.com/mcp`

---

## 1. Quick Setup for Claude Desktop (macOS)

Open or edit your Claude Desktop configuration file located at:
`~/Library/Application Support/Claude/claude_desktop_config.json`

Add the `supabase` configuration under `mcpServers`:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase",
        "--project-ref=khohlbyvnmmmdmyhusvg"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_SUPABASE_PERSONAL_ACCESS_TOKEN"
      }
    }
  }
}
```

> **Where to get your Personal Access Token (PAT):**
> 1. Visit: [https://supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)
> 2. Click **Generate new token**, name it `Claude MCP`, and copy the token.
> 3. Paste it in place of `YOUR_SUPABASE_PERSONAL_ACCESS_TOKEN`.
> 4. Restart Claude Desktop. You will see a hammer icon with Supabase tools!

---

## 2. Quick Setup for Cursor / Windsurf / Antigravity IDE

Both [`.mcp.json`](file:///Users/shiyasahmad/Documents/shabeena/.mcp.json) and [`.agents/mcp_config.json`](file:///Users/shiyasahmad/Documents/shabeena/.agents/mcp_config.json) have been created in your project!

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp"
    },
    "supabase-cli": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase",
        "--project-ref=khohlbyvnmmmdmyhusvg"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_SUPABASE_PERSONAL_ACCESS_TOKEN"
      }
    }
  }
}
```

* In **Cursor**: Open **Settings &rarr; Features &rarr; MCP**, and it will automatically detect `.mcp.json`.
* In **Antigravity IDE**: Automatically discovered via `.agents/mcp_config.json`.

---

## 3. Quick Setup for ChatGPT & SuperMCP

For **ChatGPT Custom Actions / SuperMCP / SSE Clients**:

1. **Option A: Official Hosted Supabase MCP Server**
   * **Server URL:** `https://mcp.supabase.com/mcp`
   * **Authentication:** OAuth 2.1 or Bearer Token (`Authorization: Bearer <YOUR_ACCESS_TOKEN>`)

2. **Option B: Run Local HTTP/SSE MCP Proxy on Port 3111**
   Run the Supabase MCP server in HTTP mode:
   ```bash
   npx -y @supabase/mcp-server-supabase --project-ref=khohlbyvnmmmdmyhusvg --access-token=YOUR_SUPABASE_TOKEN --http --port=3111
   ```
   * Your AI agent connects to: `http://localhost:3111/sse`

---

## 4. What You Can Ask AI Agents Once Connected

Once connected, you can give natural language prompts to your AI agent:
* *"Show me the latest 5 achievement records from my Supabase database."*
* *"Add a new exhibit called 'Robotics Expo 2026' into the content_items table for the student-projects section."*
* *"Update the award details for Sepaktakraw championship."*
* *"Check if the sections table has all 8 school sections."*
* *"Run the SQL migration in supabase_cms_v2_schema.sql to ensure all tables exist."*
