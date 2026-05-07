const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp");
const { ApiError } = require("../errors");
const { TICKET_STATUSES } = require("../constants");
const {
  createTicket,
  listTickets,
  getTicketById,
  updateTicketStatus,
} = require("../store/ticketStore");
const {
  validateCreateTicketBody,
  validateListFilters,
  validateStatusUpdateBody,
} = require("../validation");
const z = require("zod");

function toToolSuccess(data, message) {
  return {
    content: [
      {
        type: "text",
        text: message,
      },
    ],
    structuredContent: {
      success: true,
      data,
    },
  };
}

function toToolError(error) {
  let code = "internal_error";
  let message = "Internal server error";
  let details;

  if (error instanceof ApiError) {
    message = error.message;
    details = error.details;

    if (error.statusCode === 400) {
      code = "validation_error";
    } else if (error.statusCode === 404) {
      code = "not_found";
    }
  }

  return {
    isError: true,
    content: [
      {
        type: "text",
        text: message,
      },
    ],
    structuredContent: {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
  };
}

function withToolHandler(handler) {
  return async (args) => {
    try {
      return await handler(args);
    } catch (error) {
      return toToolError(error);
    }
  };
}

function createMcpServer() {
  const server = new McpServer(
    {
      name: "it-support-ticket-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.registerTool(
    "create_ticket",
    {
      description: "Create an IT support ticket.",
      inputSchema: {
        title: z.string(),
        description: z.string(),
        requester: z.string(),
      },
    },
    withToolHandler(async ({ title, description, requester }) => {
      const payload = { title, description, requester };
      validateCreateTicketBody(payload);
      const ticket = createTicket(payload);
      return toToolSuccess({ ticket }, "Ticket created");
    }),
  );

  server.registerTool(
    "list_tickets",
    {
      description: "List tickets with optional status/search filtering.",
      inputSchema: {
        status: z.enum(TICKET_STATUSES).optional(),
        search: z.string().optional(),
      },
    },
    withToolHandler(async ({ status, search }) => {
      validateListFilters({ status, search });
      const tickets = listTickets({ status, search });
      return toToolSuccess({ tickets }, "Tickets retrieved");
    }),
  );

  server.registerTool(
    "get_ticket",
    {
      description: "Get one ticket by id.",
      inputSchema: {
        id: z.string(),
      },
    },
    withToolHandler(async ({ id }) => {
      const ticket = getTicketById(id);
      if (!ticket) {
        throw new ApiError(404, "Ticket not found");
      }

      return toToolSuccess({ ticket }, "Ticket retrieved");
    }),
  );

  server.registerTool(
    "update_ticket_status",
    {
      description: "Update ticket status while enforcing status transition rules.",
      inputSchema: {
        id: z.string(),
        status: z.enum(TICKET_STATUSES),
      },
    },
    withToolHandler(async ({ id, status }) => {
      const ticket = getTicketById(id);
      if (!ticket) {
        throw new ApiError(404, "Ticket not found");
      }

      validateStatusUpdateBody({ status }, ticket.status);
      const updatedTicket = updateTicketStatus(id, status);
      return toToolSuccess({ ticket: updatedTicket }, "Ticket status updated");
    }),
  );

  return server;
}

module.exports = {
  createMcpServer,
};
