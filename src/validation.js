const { TICKET_STATUSES, STATUS_TRANSITIONS, URGENCY_LEVELS, TOPIC_CATEGORIES } = require("./constants");
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

  ensureNonEmptyString(body.subject, "subject");
  ensureNonEmptyString(body.description, "description");
  ensureNonEmptyString(body.submitter_ref, "submitter_ref");
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

  if (query.urgency && !URGENCY_LEVELS.includes(query.urgency)) {
    throw new ApiError(400, "Validation failed", {
      urgency: `urgency must be one of: ${URGENCY_LEVELS.join(", ")}`,
    });
  }

  if (query.category && !TOPIC_CATEGORIES.includes(query.category)) {
    throw new ApiError(400, "Validation failed", {
      category: `category must be one of: ${TOPIC_CATEGORIES.join(", ")}`,
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

function validateUrgencyLevel(body) {
  if (!body || typeof body !== "object") {
    throw new ApiError(400, "Validation failed", {
      body: "Request body must be a JSON object",
    });
  }

  const urgency = body.urgency;
  if (urgency !== undefined && !URGENCY_LEVELS.includes(urgency)) {
    throw new ApiError(400, "Validation failed", {
      urgency: `urgency must be one of: ${URGENCY_LEVELS.join(", ")}`,
    });
  }
}

function validateTopicCategory(body) {
  if (!body || typeof body !== "object") {
    throw new ApiError(400, "Validation failed", {
      body: "Request body must be a JSON object",
    });
  }

  const category = body.category;
  if (category !== undefined && !TOPIC_CATEGORIES.includes(category)) {
    throw new ApiError(400, "Validation failed", {
      category: `category must be one of: ${TOPIC_CATEGORIES.join(", ")}`,
    });
  }
}

function validateResearcherConfidence(body) {
  if (!body || typeof body !== "object") {
    throw new ApiError(400, "Validation failed", {
      body: "Request body must be a JSON object",
    });
  }

  const confidence = body.confidence_score;
  if (confidence !== undefined && (typeof confidence !== "number" || confidence < 0 || confidence > 1)) {
    throw new ApiError(400, "Validation failed", {
      confidence_score: "confidence_score must be a number between 0 and 1",
    });
  }
}

function validatePiiRedacted(body) {
  if (!body || typeof body !== "object") {
    throw new ApiError(400, "Validation failed", {
      body: "Request body must be a JSON object",
    });
  }

  const piiRedacted = body.pii_redacted;
  if (piiRedacted !== undefined && typeof piiRedacted !== "boolean") {
    throw new ApiError(400, "Validation failed", {
      pii_redacted: "pii_redacted must be a boolean",
    });
  }
}

module.exports = {
  validateCreateTicketBody,
  validateListFilters,
  validateStatusUpdateBody,
  validateUrgencyLevel,
  validateTopicCategory,
  validateResearcherConfidence,
  validatePiiRedacted,
};