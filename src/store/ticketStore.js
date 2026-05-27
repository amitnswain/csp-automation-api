const { randomUUID } = require("node:crypto");

const tickets = [];

const SAMPLE_TICKETS = [
  {
    title: "Cannot connect to corporate VPN",
    description: "VPN client fails with authentication timeout after password reset.",
    requester: "alice.ng",
    status: "open",
  },
  {
    title: "Outlook not syncing inbox",
    description: "New emails are not appearing on desktop Outlook since this morning.",
    requester: "michael.tan",
    status: "in_progress",
  },
  {
    title: "Laptop camera not detected",
    description: "Camera is missing in Teams and Device Manager after last update.",
    requester: "sara.lee",
    status: "resolved",
  },
];

function createTicket(payload) {
  const timestamp = new Date().toISOString();
  const ticket = {
    ticket_id: randomUUID(),
    subject: payload.subject,
    description: payload.description,
    submitter_ref: payload.submitter_ref,
    status: "open",
    urgency: null,
    category: null,
    triage_result: null,
    pii_redacted: false,
    confidence_score: null,
    escalation_reason: null,
    ai_processing_log: [],
    draft_response: null,
    final_response: null,
    created_at: timestamp,
    updated_at: timestamp,
    resolved_at: null,
  };

  tickets.push(ticket);
  return ticket;
}

function listTickets(filters = {}) {
  const normalizedSearch = filters.search ? filters.search.toLowerCase() : null;

  return tickets.filter((ticket) => {
    if (filters.status && ticket.status !== filters.status) {
      return false;
    }

    if (filters.urgency && ticket.urgency !== filters.urgency) {
      return false;
    }

    if (filters.category && ticket.category !== filters.category) {
      return false;
    }

    if (normalizedSearch) {
      const haystack = `${ticket.subject} ${ticket.description}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    }

    return true;
  });
}

function getTicketById(id) {
  return tickets.find((ticket) => ticket.ticket_id === id) || null;
}

function updateTicketStatus(id, newStatus) {
  const ticket = getTicketById(id);
  if (!ticket) {
    return null;
  }

  ticket.status = newStatus;
  ticket.updated_at = new Date().toISOString();
  if (newStatus === "closed") {
    ticket.resolved_at = new Date().toISOString();
  }
  return ticket;
}

function updateTicketFields(id, updates) {
  const ticket = getTicketById(id);
  if (!ticket) {
    return null;
  }

  Object.assign(ticket, updates, { updated_at: new Date().toISOString() });
  if (updates.status && updates.status === "closed") {
    ticket.resolved_at = new Date().toISOString();
  }
  return ticket;
}

async function addToProcessingLog(ticketId, logEntry) {
  const ticket = getTicketById(ticketId);
  if (!ticket) {
    return null;
  }

  if (!Array.isArray(ticket.ai_processing_log)) {
    ticket.ai_processing_log = [];
  }

  ticket.ai_processing_log.push({
    timestamp: new Date().toISOString(),
    ...logEntry
  });

  ticket.updated_at = new Date().toISOString();
  return ticket; 
}

function resetStore() {
  tickets.length = 0;
}

function seedSampleTickets() {
  if (tickets.length > 0) {
    return tickets;
  }

  const seededAt = new Date().toISOString();
  const seedTickets = SAMPLE_TICKETS.map((sample) => ({
    ticket_id: randomUUID(),
    subject: sample.title,
    description: sample.description,
    submitter_ref: sample.requester,
    status: sample.status,
    urgency: null,
    category: null,
    triage_result: null,
    pii_redacted: false,
    confidence_score: null,
    escalation_reason: null,
    ai_processing_log: [],
    draft_response: null,
    final_response: null,
    created_at: seededAt,
    updated_at: seededAt,
    resolved_at: sample.status === "resolved" ? new Date().toISOString() : null,
  }));

  tickets.push(...seedTickets);
  return tickets;
}

module.exports = {
  createTicket,
  listTickets,
  getTicketById,
  updateTicketStatus,
  updateTicketFields,
  addToProcessingLog,
  resetStore,
  seedSampleTickets,
};