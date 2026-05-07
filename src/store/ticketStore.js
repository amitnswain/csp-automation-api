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
    id: randomUUID(),
    title: payload.title,
    description: payload.description,
    requester: payload.requester,
    status: "open",
    createdAt: timestamp,
    updatedAt: timestamp,
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

    if (normalizedSearch) {
      const haystack = `${ticket.title} ${ticket.description}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    }

    return true;
  });
}

function getTicketById(id) {
  return tickets.find((ticket) => ticket.id === id) || null;
}

function updateTicketStatus(id, newStatus) {
  const ticket = getTicketById(id);
  if (!ticket) {
    return null;
  }

  ticket.status = newStatus;
  ticket.updatedAt = new Date().toISOString();
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
    id: randomUUID(),
    title: sample.title,
    description: sample.description,
    requester: sample.requester,
    status: sample.status,
    createdAt: seededAt,
    updatedAt: seededAt,
  }));

  tickets.push(...seedTickets);
  return tickets;
}

module.exports = {
  createTicket,
  listTickets,
  getTicketById,
  updateTicketStatus,
  resetStore,
  seedSampleTickets,
};
