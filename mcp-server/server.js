const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { z } = require("zod");
const { ApiError } = require("../api/src/errors");
const {
  createTicket,
  listTickets,
  getTicketById,
  updateTicketStatus,
  updateTicketFields,
} = require("../api/src/store/ticketStore");
const {
  validateCreateTicketBody,
  validateListFilters,
  validateStatusUpdateBody,
  validateUrgencyLevel,
  validateTopicCategory,
  validateResearcherConfidence,
} = require("../api/src/validation");

// Define Zod schemas for MCP requests
const CallToolRequestSchema = z.object({
  method: z.literal('tools/call'),
  params: z.object({
    name: z.string(),
    arguments: z.record(z.unknown())
  })
});

const ListToolsRequestSchema = z.object({
  method: z.literal('tools/list'),
  params: z.object({}).optional()
});

// Tool definitions
const TOOLS = [
  {
    name: "create_ticket",
    description: "Create a new support ticket.",
    inputSchema: {
      type: "object",
      properties: {
        subject: { type: "string", description: "Ticket subject" },
        description: { type: "string", description: "Ticket description" },
        submitter_ref: { type: "string", description: "Submitter reference" },
      },
      required: ["subject", "description", "submitter_ref"],
    },
  },
  {
    name: "list_tickets",
    description: "List support tickets with optional filters.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by status" },
        urgency: { type: "string", description: "Filter by urgency" },
        category: { type: "string", description: "Filter by category" },
        search: { type: "string", description: "Search query" },
      },
    },
  },
  {
    name: "get_ticket",
    description: "Get a specific support ticket by ID.",
    inputSchema: {
      type: "object",
      properties: {
        ticket_id: { type: "string", description: "Ticket ID" },
      },
      required: ["ticket_id"],
    },
  },
  {
    name: "update_ticket_status",
    description: "Update a ticket's status with state transition validation.",
    inputSchema: {
      type: "object",
      properties: {
        ticket_id: { type: "string", description: "Ticket ID" },
        status: { type: "string", description: "New status" },
      },
      required: ["ticket_id", "status"],
    },
  },
  {
    name: "update_ticket_urgency",
    description: "Update a ticket's urgency level.",
    inputSchema: {
      type: "object",
      properties: {
        ticket_id: { type: "string", description: "Ticket ID" },
        urgency: { type: "string", description: "Urgency level" },
      },
      required: ["ticket_id", "urgency"],
    },
  },
  {
    name: "update_ticket_category",
    description: "Update a ticket's category or topic.",
    inputSchema: {
      type: "object",
      properties: {
        ticket_id: { type: "string", description: "Ticket ID" },
        category: { type: "string", description: "Category" },
      },
      required: ["ticket_id", "category"],
    },
  },
  {
    name: "update_ticket_confidence_score",
    description: "Update researcher confidence score.",
    inputSchema: {
      type: "object",
      properties: {
        ticket_id: { type: "string", description: "Ticket ID" },
        confidence_score: { type: "number", description: "Confidence score 0-1", minimum: 0, maximum: 1 },
      },
      required: ["ticket_id", "confidence_score"],
    },
  },
];

// Helper function to wrap tool handlers with error handling
function withToolHandler(handler) {
  return handler;
}

// Helper function to format success responses
function toToolSuccess(data, message) {
  return {
    success: true,
    data,
    message,
  };
}

// Helper function to format error responses
function toToolError(code, message, details) {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

function createMcpServer() {
  const server = new Server(
    {
      name: "customer-support-assistant-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Set request handler for tools/list
  server.setRequestHandler(ListToolsRequestSchema, async (request) => {
    return {
      tools: TOOLS,
    };
  });

  // Set request handler for tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result;

      if (name === "create_ticket") {
        validateCreateTicketBody(args);
        const ticket = createTicket(args);
        result = toToolSuccess({ ticket }, "Ticket created successfully");
      } else if (name === "list_tickets") {
        validateListFilters(args);
        const tickets = listTickets(args);
        result = toToolSuccess({ tickets }, "Tickets retrieved successfully");
      } else if (name === "get_ticket") {
        const ticket = getTicketById(args.ticket_id);
        if (!ticket) {
          result = toToolError("not_found", "Ticket not found");
        } else {
          result = toToolSuccess({ ticket }, "Ticket retrieved successfully");
        }
      } else if (name === "update_ticket_status") {
        const ticket = getTicketById(args.ticket_id);
        if (!ticket) {
          result = toToolError("not_found", "Ticket not found");
        } else {
          validateStatusUpdateBody({ status: args.status }, ticket.status);
          const updatedTicket = updateTicketStatus(args.ticket_id, args.status);
          result = toToolSuccess({ ticket: updatedTicket }, "Ticket status updated successfully");
        }
      } else if (name === "update_ticket_urgency") {
        const ticket = getTicketById(args.ticket_id);
        if (!ticket) {
          result = toToolError("not_found", "Ticket not found");
        } else {
          validateUrgencyLevel({ urgency: args.urgency });
          const updatedTicket = updateTicketFields(args.ticket_id, { urgency: args.urgency });
          result = toToolSuccess({ ticket: updatedTicket }, "Ticket urgency updated successfully");
        }
      } else if (name === "update_ticket_category") {
        const ticket = getTicketById(args.ticket_id);
        if (!ticket) {
          result = toToolError("not_found", "Ticket not found");
        } else {
          validateTopicCategory({ category: args.category });
          const updatedTicket = updateTicketFields(args.ticket_id, { category: args.category });
          result = toToolSuccess({ ticket: updatedTicket }, "Ticket category updated successfully");
        }
      } else if (name === "update_ticket_confidence_score") {
        const ticket = getTicketById(args.ticket_id);
        if (!ticket) {
          result = toToolError("not_found", "Ticket not found");
        } else {
          validateResearcherConfidence({ confidence_score: args.confidence_score });
          const updatedTicket = updateTicketFields(args.ticket_id, { confidence_score: args.confidence_score });
          result = toToolSuccess({ ticket: updatedTicket }, "Researcher confidence updated");
        }
      } else {
        result = toToolError("unknown_tool", `Unknown tool: ${name}`);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result),
          },
        ],
      };
    } catch (error) {
      if (error instanceof ApiError) {
        const errorResult = toToolError("validation_error", error.message, error.details);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(errorResult),
            },
          ],
        };
      }
      throw error;
    }
  });

  return server;
}

module.exports = { createMcpServer };