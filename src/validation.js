const { TICKET_STATUSES, STATUS_TRANSITIONS } = require("./constants");
const { ApiError } = require("./errors");

function ensureNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(400, "Validation failed", {
      [fieldName]: `${fieldName} is required and must be a non-empty string`,
    });
  }
}

function validateCreateTicketBody(body) {
  if (!body || typeof body !== "object") {
    throw new ApiError(400, "Validation failed", {
      body: "Request body must be a JSON object",
    });
  }

  ensureNonEmptyString(body.title, "title");
  ensureNonEmptyString(body.description, "description");
  ensureNonEmptyString(body.requester, "requester");
}

function validateListFilters(query) {
  if (!query) {
    return;
  }

  if (query.status && !TICKET_STATUSES.includes(query.status)) {
    throw new ApiError(400, "Validation failed", {
      status: `status must be one of: ${TICKET_STATUSES.join(", ")}`,
    });
  }

  if (query.search !== undefined && typeof query.search !== "string") {
    throw new ApiError(400, "Validation failed", {
      search: "search must be a string",
    });
  }
}

function validateStatusUpdateBody(body, currentStatus) {
  if (!body || typeof body !== "object") {
    throw new ApiError(400, "Validation failed", {
      body: "Request body must be a JSON object",
    });
  }

  const nextStatus = body.status;

  if (!TICKET_STATUSES.includes(nextStatus)) {
    throw new ApiError(400, "Validation failed", {
      status: `status must be one of: ${TICKET_STATUSES.join(", ")}`,
    });
  }

  if (nextStatus === currentStatus) {
    throw new ApiError(400, "Validation failed", {
      status: `Ticket is already in status '${currentStatus}'`,
    });
  }

  const allowedNextStatuses = STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowedNextStatuses.includes(nextStatus)) {
    throw new ApiError(400, "Validation failed", {
      status: `Invalid status transition from '${currentStatus}' to '${nextStatus}'`,
    });
  }
}

module.exports = {
  validateCreateTicketBody,
  validateListFilters,
  validateStatusUpdateBody,
};
