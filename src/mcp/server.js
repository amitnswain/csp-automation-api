const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { z } = require("zod");
const { ApiError } = require("../errors");
const {
  createTicket,
  listTickets,
  getTicketById,
  updateTicketStatus,
  updateTicketFields,
} = require("../store/ticketStore");
const {
  validateCreateTicketBody,
  validateListFilters,
  validateStatusUpdateBody,
  validateUrgencyLevel,
  validateTopicCategory,
  validateResearcherConfidence,
} = require("../validation");

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
  const server = new Server({
    name: "customer-support-assistant-mcp",
    version: "1.0.0",
  });

  server.registerTool(
    "create_ticket",
    {
      description: "Create a new support ticket.",
      inputSchema: z.object({
        subject: z.string(),
        description: z.string(),
        submitter_ref: z.string(),
      }),
    },
    async ({ subject, description, submitter_ref }) => {
      try {
        validateCreateTicketBody({ subject, description, submitter_ref });
        const ticket = createTicket({ subject, description, submitter_ref });
        return toToolSuccess({ ticket }, "Ticket created successfully");
      } catch (error) {
        if (error instanceof ApiError) {
          return toToolError("validation_error", error.message, error.details);
        }
        throw error;
      }
    },
  );

  server.registerTool(
    "list_tickets",
    {
      description: "List support tickets with optional filters.",
      inputSchema: z.object({
        status: z.string().optional(),
        urgency: z.string().optional(),
        category: z.string().optional(),
        search: z.string().optional(),
      }),
    },
    async ({ status, urgency, category, search }) => {
      try {
        validateListFilters({ status, urgency, category, search });
        const tickets = listTickets({ status, urgency, category, search });
        return toToolSuccess({ tickets }, "Tickets retrieved successfully");
      } catch (error) {
        if (error instanceof ApiError) {
          return toToolError("validation_error", error.message, error.details);
        }
        throw error;
      }
    },
  );

  server.registerTool(
    "get_ticket",
    {
      description: "Get a specific support ticket by ID.",
      inputSchema: z.object({
        ticket_id: z.string(),
      }),
    },
    async ({ ticket_id }) => {
      const ticket = getTicketById(ticket_id);
      if (!ticket) {
        return toToolError("not_found", "Ticket not found");
      }
      return toToolSuccess({ ticket }, "Ticket retrieved successfully");
    },
  );

  server.registerTool(
    "update_ticket_status",
    {
      description: "Update a ticket's status with state transition validation.",
      inputSchema: z.object({
        ticket_id: z.string(),
        status: z.string(),
      }),
    },
    async ({ ticket_id, status }) => {
      try {
        const ticket = getTicketById(ticket_id);
        if (!ticket) {
          return toToolError("not_found", "Ticket not found");
        }

        validateStatusUpdateBody({ status }, ticket.status);
        const updatedTicket = updateTicketStatus(ticket_id, status);
        return toToolSuccess({ ticket: updatedTicket }, "Ticket status updated successfully");
      } catch (error) {
        if (error instanceof ApiError) {
          return toToolError("validation_error", error.message, error.details);
        }
        throw error;
      }
    },
  );

  server.registerTool(
    "update_ticket_urgency",
    {
      description: "Update a ticket's urgency level.",
      inputSchema: z.object({
        ticket_id: z.string(),
        urgency: z.string().optional(),
      }),
    },
    async ({ ticket_id, urgency }) => {
      try {
        const ticket = getTicketById(ticket_id);
        if (!ticket) {
          return toToolError("not_found", "Ticket not found");
        }

        validateUrgencyLevel({ urgency });
        const updatedTicket = updateTicketFields(ticket_id, { urgency });
        return toToolSuccess({ ticket: updatedTicket }, "Ticket urgency updated successfully");
      } catch (error) {
        if (error instanceof ApiError) {
          return toToolError("validation_error", error.message, error.details);
        }
        throw error;
      }
    },
  );

  server.registerTool(
    "update_ticket_category",
    {
      description: "Update a ticket's category or topic.",
      inputSchema: z.object({
        ticket_id: z.string(),
        category: z.string().optional(),
      }),
    },
    async ({ ticket_id, category }) => {
      try {
        const ticket = getTicketById(ticket_id);
        if (!ticket) {
          return toToolError("not_found", "Ticket not found");
        }

        validateTopicCategory({ category });
        const updatedTicket = updateTicketFields(ticket_id, { category });
        return toToolSuccess({ ticket: updatedTicket }, "Ticket category updated successfully");
      } catch (error) {
        if (error instanceof ApiError) {
          return toToolError("validation_error", error.message, error.details);
        }
        throw error;
      }
    },
  );

  server.registerTool(
    "update_ticket_confidence_score",
    {
      description: "Update researcher confidence score.",
      inputSchema: z.object({
        ticket_id: z.string(),
        confidence_score: z.number().min(0).max(1),
      }),
    },
    async ({ ticket_id, confidence_score }) => {
      try {
        const ticket = getTicketById(ticket_id);
        if (!ticket) {
          return toToolError("not_found", "Ticket not found");
        }

        validateResearcherConfidence({ confidence_score });
        const updatedTicket = updateTicketFields(ticket_id, { confidence_score });
        return toToolSuccess({ ticket: updatedTicket }, "Researcher confidence updated");
      } catch (error) {
        if (error instanceof ApiError) {
          return toToolError("validation_error", error.message, error.details);
        }
        throw error;
      }
    },
  );

  return server;
}

module.exports = { createMcpServer };