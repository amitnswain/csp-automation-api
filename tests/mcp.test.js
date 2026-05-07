const request = require("supertest");
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StreamableHTTPClientTransport } = require("@modelcontextprotocol/sdk/client/streamableHttp.js");
const app = require("../src/app");
const { resetStore } = require("../src/store/ticketStore");

function startServer() {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      resolve(server);
    });
  });
}

describe("MCP Server Integration", () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    server = await startServer();
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  });

  beforeEach(() => {
    resetStore();
  });

  async function connectClient() {
    const client = new Client({
      name: "mcp-test-client",
      version: "1.0.0",
    });
    const transport = new StreamableHTTPClientTransport(new URL(`${baseUrl}/mcp`));
    await client.connect(transport);
    return { client, transport };
  }

  async function disconnectClient(transport) {
    await transport.close();
  }

  it("completes MCP initialize handshake and exposes all ticket tools", async () => {
    const { client, transport } = await connectClient();

    try {
      expect(client.getServerVersion()).toEqual(
        expect.objectContaining({
          name: "it-support-ticket-mcp",
        }),
      );

      const tools = await client.listTools();
      const toolNames = tools.tools.map((tool) => tool.name);

      expect(toolNames).toEqual(
        expect.arrayContaining([
          "create_ticket",
          "list_tickets",
          "get_ticket",
          "update_ticket_status",
        ]),
      );
    } finally {
      await disconnectClient(transport);
    }
  });

  it("supports create, list, get, and status update through MCP tools", async () => {
    const { client, transport } = await connectClient();

    try {
      const created = await client.callTool({
        name: "create_ticket",
        arguments: {
          title: "Wifi not working",
          description: "Office wifi disconnected",
          requester: "jane.doe",
        },
      });

      expect(created.isError).not.toBe(true);
      const ticketId = created.structuredContent.data.ticket.id;

      const updated = await client.callTool({
        name: "update_ticket_status",
        arguments: {
          id: ticketId,
          status: "in_progress",
        },
      });
      expect(updated.isError).not.toBe(true);
      expect(updated.structuredContent.data.ticket.status).toBe("in_progress");

      const fetched = await client.callTool({
        name: "get_ticket",
        arguments: { id: ticketId },
      });
      expect(fetched.isError).not.toBe(true);
      expect(fetched.structuredContent.data.ticket.id).toBe(ticketId);

      const listed = await client.callTool({
        name: "list_tickets",
        arguments: { status: "in_progress" },
      });
      expect(listed.isError).not.toBe(true);
      expect(listed.structuredContent.data.tickets).toHaveLength(1);
    } finally {
      await disconnectClient(transport);
    }
  });

  it("returns validation errors for invalid create input", async () => {
    const { client, transport } = await connectClient();

    try {
      const result = await client.callTool({
        name: "create_ticket",
        arguments: {
          title: "",
          description: "Password reset required",
          requester: "john",
        },
      });

      expect(result.isError).toBe(true);
      expect(result.structuredContent.error.code).toBe("validation_error");
      expect(result.structuredContent.error.message).toBe("Validation failed");
    } finally {
      await disconnectClient(transport);
    }
  });

  it("returns not-found errors for unknown ticket IDs", async () => {
    const { client, transport } = await connectClient();

    try {
      const result = await client.callTool({
        name: "get_ticket",
        arguments: { id: "missing-id" },
      });

      expect(result.isError).toBe(true);
      expect(result.structuredContent.error.code).toBe("not_found");
      expect(result.structuredContent.error.message).toBe("Ticket not found");
    } finally {
      await disconnectClient(transport);
    }
  });

  it("returns validation errors for invalid status transitions", async () => {
    const { client, transport } = await connectClient();

    try {
      const created = await client.callTool({
        name: "create_ticket",
        arguments: {
          title: "Printer offline",
          description: "Unable to print",
          requester: "ops.user",
        },
      });

      const ticketId = created.structuredContent.data.ticket.id;

      await client.callTool({
        name: "update_ticket_status",
        arguments: { id: ticketId, status: "closed" },
      });

      const invalidTransition = await client.callTool({
        name: "update_ticket_status",
        arguments: { id: ticketId, status: "in_progress" },
      });

      expect(invalidTransition.isError).toBe(true);
      expect(invalidTransition.structuredContent.error.code).toBe("validation_error");
      expect(invalidTransition.structuredContent.error.message).toBe("Validation failed");
    } finally {
      await disconnectClient(transport);
    }
  });

  it("keeps MCP behavior aligned with REST behavior", async () => {
    const { client, transport } = await connectClient();

    try {
      const restCreate = await request(app).post("/tickets").send({
        title: "VPN token expired",
        description: "Cannot connect after token expiry",
        requester: "rest.user",
      });

      const restTicket = restCreate.body;

      const mcpGet = await client.callTool({
        name: "get_ticket",
        arguments: { id: restTicket.id },
      });

      expect(mcpGet.isError).not.toBe(true);
      expect(mcpGet.structuredContent.data.ticket.id).toBe(restTicket.id);
      expect(mcpGet.structuredContent.data.ticket.title).toBe(restTicket.title);
    } finally {
      await disconnectClient(transport);
    }
  });
});
