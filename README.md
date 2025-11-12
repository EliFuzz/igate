# iGate

iGate is a tool for managing and orchestrating MCP Servers. It provides a unified interface for interacting with various services, making it easier to build and maintain complex applications.

## Usage

1. Create a custom `mcp.json` file with all MCP servers you want to use. For example:

```json
{
  "servers": {
    "your-server-name": {
      "command": "your-server-command",
      "args": ["your", "server", "arguments"]
    }
  }
}
```

2. Create ENV varible `IGATE_SERVERS` and export it:

```bash
export IGATE_SERVERS=$(cat ~/<path-to-your-custom>/mcp.json)
```

3. Add iGate to your `mcp.json` file:

```json
{
  "servers": {
    "igate": {
      "command": "npx",
      "args": ["igate"]
    }
  }
}
```

4. Start iGate and verify it's working by asking: "show all igate available tools"

## Configuration

In custom `mcp.json`, you can configure iGate with the following options:

- `igate.allow`: An array of allowed tools for iGate to use. Only tools listed here will be accessible. Example:

```json
{
  "servers": {
    "context7-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "--node-options=--experimental-fetch",
        "@upstash/context7-mcp@latest"
      ],
      "igate": {
        "allow": ["resolve-library-id", "get-library-docs"]
      }
    }
  }
}
```

- `igate.deny`: An array of denied tools for iGate. Deny tools listed here won't be accessible. Example:

```json
{
  "servers": {
    "context7-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "--node-options=--experimental-fetch",
        "@upstash/context7-mcp@latest"
      ],
      "igate": {
        "deny": ["resolve-library-id"]
      }
    }
  }
}
```

- `${ENV_VAR}`: You can use environment variables in the `headers` and `env` fields to dynamically set values based on your environment. Example:

```json
{
  "servers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer ${GITHUB_PAT}"
      }
    }
  }
}
```
