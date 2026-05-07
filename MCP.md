# MCP Server Usage

This service exposes an MCP endpoint over Streamable HTTP in the same process as the REST API.

## Endpoint

- URL: `http://localhost:3000/mcp`
- Transport: Streamable HTTP
- Auth: none (development only)

## Available Tools

### `create_ticket`

Creates a new ticket.

Input:

```json
{
  "title": "Laptop not booting",
  "description": "Device is stuck on BIOS screen",
  "requester": "alice.ng"
}
```

### `list_tickets`

Lists tickets with optional filters.

Input:

```json
{
  "status": "open",
  "search": "vpn"
}
```

Both fields are optional.

### `get_ticket`

Retrieves one ticket by ID.

Input:

```json
{
  "id": "ticket-id"
}
```

### `update_ticket_status`

Updates a ticket status (transition rules are enforced).

Input:

```json
{
  "id": "ticket-id",
  "status": "in_progress"
}
```

Allowed statuses: `open`, `in_progress`, `resolved`, `closed`.

## Tool Result Shapes

Success:

```json
{
  "success": true,
  "data": {}
}
```

Failure:

```json
{
  "success": false,
  "error": {
    "code": "validation_error",
    "message": "Validation failed",
    "details": {}
  }
}
```
