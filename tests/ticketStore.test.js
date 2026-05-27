const {
  createTicket,
  listTickets,
  getTicketById,
  updateTicketStatus,
  updateTicketFields,
  addToProcessingLog,
  resetStore,
  seedSampleTickets,
} = require("../src/store/ticketStore");

describe("Ticket Store", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("createTicket", () => {
    it("creates a ticket with required fields", () => {
      const payload = {
        subject: "Test ticket",
        description: "Test description",
        submitter_ref: "user@example.com",
      };

      const ticket = createTicket(payload);

      expect(ticket).toHaveProperty("ticket_id");
      expect(ticket.subject).toBe("Test ticket");
      expect(ticket.description).toBe("Test description");
      expect(ticket.submitter_ref).toBe("user@example.com");
      expect(ticket.status).toBe("open");
      expect(ticket.created_at).toBeDefined();
      expect(ticket.updated_at).toBeDefined();
      expect(ticket.resolved_at).toBeNull();
    });

    it("generates unique ticket IDs", () => {
      const ticket1 = createTicket({
        subject: "Ticket 1",
        description: "Description 1",
        submitter_ref: "user1",
      });
      const ticket2 = createTicket({
        subject: "Ticket 2",
        description: "Description 2",
        submitter_ref: "user2",
      });

      expect(ticket1.ticket_id).not.toBe(ticket2.ticket_id);
    });

    it("initializes optional fields as null or empty", () => {
      const ticket = createTicket({
        subject: "Test",
        description: "Description",
        submitter_ref: "user",
      });

      expect(ticket.urgency).toBeNull();
      expect(ticket.category).toBeNull();
      expect(ticket.triage_result).toBeNull();
      expect(ticket.pii_redacted).toBe(false);
      expect(ticket.confidence_score).toBeNull();
      expect(ticket.escalation_reason).toBeNull();
      expect(Array.isArray(ticket.ai_processing_log)).toBe(true);
      expect(ticket.ai_processing_log.length).toBe(0);
      expect(ticket.draft_response).toBeNull();
      expect(ticket.final_response).toBeNull();
    });

    it("sets timestamps correctly", () => {
      const beforeCreation = new Date();
      const ticket = createTicket({
        subject: "Test",
        description: "Description",
        submitter_ref: "user",
      });
      const afterCreation = new Date();

      const createdAt = new Date(ticket.created_at);
      const updatedAt = new Date(ticket.updated_at);

      expect(createdAt >= beforeCreation).toBe(true);
      expect(createdAt <= afterCreation).toBe(true);
      expect(updatedAt).toEqual(createdAt);
    });

    it("creates multiple tickets independently", () => {
      const ticket1 = createTicket({
        subject: "Ticket 1",
        description: "Description 1",
        submitter_ref: "user1",
      });
      const ticket2 = createTicket({
        subject: "Ticket 2",
        description: "Description 2",
        submitter_ref: "user2",
      });
      const ticket3 = createTicket({
        subject: "Ticket 3",
        description: "Description 3",
        submitter_ref: "user3",
      });

      expect(listTickets().length).toBe(3);
      expect(ticket1.ticket_id).not.toBe(ticket2.ticket_id);
      expect(ticket2.ticket_id).not.toBe(ticket3.ticket_id);
    });
  });

  describe("listTickets", () => {
    beforeEach(() => {
      createTicket({
        subject: "Open ticket",
        description: "This is open",
        submitter_ref: "user1",
      });
      const ticket2 = createTicket({
        subject: "Closed ticket",
        description: "This is closed",
        submitter_ref: "user2",
      });
      updateTicketStatus(ticket2.ticket_id, "closed");

      const ticket3 = createTicket({
        subject: "In progress ticket",
        description: "This is in progress",
        submitter_ref: "user3",
      });
      updateTicketStatus(ticket3.ticket_id, "in_progress");
    });

    it("returns all tickets without filters", () => {
      const tickets = listTickets();

      expect(tickets.length).toBe(3);
    });

    it("filters tickets by status", () => {
      const openTickets = listTickets({ status: "open" });
      const closedTickets = listTickets({ status: "closed" });
      const inProgressTickets = listTickets({ status: "in_progress" });

      expect(openTickets.length).toBe(1);
      expect(closedTickets.length).toBe(1);
      expect(inProgressTickets.length).toBe(1);
      expect(openTickets[0].status).toBe("open");
      expect(closedTickets[0].status).toBe("closed");
    });

    it("filters tickets by urgency", () => {
      const ticket = createTicket({
        subject: "Urgent ticket",
        description: "This is urgent",
        submitter_ref: "user4",
      });
      updateTicketFields(ticket.ticket_id, { urgency: "high" });

      const highUrgencyTickets = listTickets({ urgency: "high" });
      const lowUrgencyTickets = listTickets({ urgency: "low" });

      expect(highUrgencyTickets.length).toBe(1);
      expect(lowUrgencyTickets.length).toBe(0);
    });

    it("filters tickets by category", () => {
      const ticket = createTicket({
        subject: "Technical issue",
        description: "This is technical",
        submitter_ref: "user5",
      });
      updateTicketFields(ticket.ticket_id, { category: "technical" });

      const technicalTickets = listTickets({ category: "technical" });
      const billingTickets = listTickets({ category: "billing" });

      expect(technicalTickets.length).toBe(1);
      expect(billingTickets.length).toBe(0);
    });

    it("searches tickets by subject and description", () => {
      const results = listTickets({ search: "open" });

      expect(results.length).toBe(1);
      expect(results[0].subject).toContain("Open");
    });

    it("searches tickets case-insensitively", () => {
      const results = listTickets({ search: "CLOSED" });

      expect(results.length).toBe(1);
      expect(results[0].subject).toContain("Closed");
    });

    it("combines multiple filters", () => {
      const ticket = createTicket({
        subject: "Open technical issue",
        description: "This is both open and technical",
        submitter_ref: "user6",
      });
      updateTicketFields(ticket.ticket_id, { category: "technical" });

      const results = listTickets({
        status: "open",
        category: "technical",
      });

      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it("returns empty array for non-matching filters", () => {
      const results = listTickets({ status: "escalated" });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });
  });

  describe("getTicketById", () => {
    it("retrieves a ticket by ID", () => {
      const created = createTicket({
        subject: "Test",
        description: "Description",
        submitter_ref: "user",
      });

      const retrieved = getTicketById(created.ticket_id);

      expect(retrieved).toEqual(created);
      expect(retrieved.ticket_id).toBe(created.ticket_id);
    });

    it("returns null for non-existent ticket", () => {
      const result = getTicketById("non-existent-id");

      expect(result).toBeNull();
    });

    it("returns the exact same object", () => {
      const created = createTicket({
        subject: "Test",
        description: "Description",
        submitter_ref: "user",
      });

      const retrieved = getTicketById(created.ticket_id);

      // Modifying the retrieved ticket should modify the stored ticket
      retrieved.subject = "Modified";
      const retrieved2 = getTicketById(created.ticket_id);
      expect(retrieved2.subject).toBe("Modified");
    });
  });

  // ... rest of your imports and previous test suites

describe("updateTicketStatus", () => {
  it("updates ticket status", async () => {
    const ticket = createTicket({
      subject: "Test",
      description: "Description",
      submitter_ref: "user",
    });

    // Capture the string value BEFORE the mock delay and execution
    const originalUpdatedAt = ticket.updated_at;

    await new Promise((resolve) => setTimeout(resolve, 10));
    const updated = updateTicketStatus(ticket.ticket_id, "in_progress");

    expect(updated.status).toBe("in_progress");
    // This will now pass flawlessly!
    expect(updated.updated_at).not.toBe(originalUpdatedAt);
  });
});

// ... rest of your tests

  describe("updateTicketFields", () => {
    it("updates multiple fields at once", () => {
      const ticket = createTicket({
        subject: "Test",
        description: "Description",
        submitter_ref: "user",
      });

      const updated = updateTicketFields(ticket.ticket_id, {
        subject: "Updated subject",
        urgency: "high",
        category: "technical",
      });

      expect(updated.subject).toBe("Updated subject");
      expect(updated.urgency).toBe("high");
      expect(updated.category).toBe("technical");
    });

    it("updates only provided fields", () => {
      const ticket = createTicket({
        subject: "Test",
        description: "Description",
        submitter_ref: "user",
      });

      updateTicketFields(ticket.ticket_id, { urgency: "low" });
      const retrieved = getTicketById(ticket.ticket_id);

      expect(retrieved.urgency).toBe("low");
      expect(retrieved.subject).toBe("Test"); // Unchanged
    });

    it("sets resolved_at when status changes to closed", () => {
      const ticket = createTicket({
        subject: "Test",
        description: "Description",
        submitter_ref: "user",
      });

      const updated = updateTicketFields(ticket.ticket_id, { status: "closed" });

      expect(updated.status).toBe("closed");
      expect(updated.resolved_at).not.toBeNull();
    });

    it("returns null for non-existent ticket", () => {
      const result = updateTicketFields("non-existent-id", { urgency: "high" });

      expect(result).toBeNull();
    });

    it("updates the updated_at timestamp", () => {
      const ticket = createTicket({
        subject: "Test",
        description: "Description",
        submitter_ref: "user",
      });
      const originalUpdatedAt = ticket.updated_at;

      const updated = updateTicketFields(ticket.ticket_id, { urgency: "high" });

      expect(updated.updated_at >= originalUpdatedAt).toBe(true);
    });

    it("updates confidence_score field", () => {
      const ticket = createTicket({
        subject: "Test",
        description: "Description",
        submitter_ref: "user",
      });

      const updated = updateTicketFields(ticket.ticket_id, {
        confidence_score: 0.85,
      });

      expect(updated.confidence_score).toBe(0.85);
    });
  });

  describe("addToProcessingLog", () => {
    it("adds a log entry to the ticket", async () => {
      const ticket = createTicket({
        subject: "Test",
        description: "Description",
        submitter_ref: "user",
      });

      const updated = await addToProcessingLog(ticket.ticket_id, {
        event: "test_event",
        description: "Test log entry",
      });

      expect(updated.ai_processing_log.length).toBe(1);
      expect(updated.ai_processing_log[0].event).toBe("test_event");
      expect(updated.ai_processing_log[0].description).toBe("Test log entry");
      expect(updated.ai_processing_log[0].timestamp).toBeDefined();
    });

    it("adds timestamp to log entry", async () => {
      const ticket = createTicket({
        subject: "Test",
        description: "Description",
        submitter_ref: "user",
      });

      const updated = await addToProcessingLog(ticket.ticket_id, {
        event: "test",
      });

      expect(updated.ai_processing_log[0].timestamp).toBeDefined();
      expect(typeof updated.ai_processing_log[0].timestamp).toBe("string");
    });

    it("adds multiple log entries", async () => {
      const ticket = createTicket({
        subject: "Test",
        description: "Description",
        submitter_ref: "user",
      });

      await addToProcessingLog(ticket.ticket_id, { event: "first" });
      await addToProcessingLog(ticket.ticket_id, { event: "second" });
      const updated = await addToProcessingLog(ticket.ticket_id, { event: "third" });

      expect(updated.ai_processing_log.length).toBe(3);
      expect(updated.ai_processing_log[0].event).toBe("first");
      expect(updated.ai_processing_log[2].event).toBe("third");
    });

    it("returns null for non-existent ticket", async () => {
      const result = await addToProcessingLog("non-existent-id", { event: "test" });

      expect(result).toBeNull();
    });

    it("preserves existing log entries", async () => {
      const ticket = createTicket({
        subject: "Test",
        description: "Description",
        submitter_ref: "user",
      });

      await addToProcessingLog(ticket.ticket_id, { event: "first" });
      const updated = await addToProcessingLog(ticket.ticket_id, { event: "second" });

      expect(updated.ai_processing_log.length).toBe(2);
      expect(updated.ai_processing_log[0].event).toBe("first");
      expect(updated.ai_processing_log[1].event).toBe("second");
    });

    it("updates the updated_at timestamp", async () => {
      const ticket = createTicket({
        subject: "Test",
        description: "Description",
        submitter_ref: "user",
      });
      const originalUpdatedAt = ticket.updated_at;

      // Add delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));
      const updated = await addToProcessingLog(ticket.ticket_id, { event: "test" });

      expect(updated.updated_at > originalUpdatedAt).toBe(true);
    });
  });

  describe("resetStore", () => {
    it("clears all tickets", () => {
      createTicket({
        subject: "Ticket 1",
        description: "Description 1",
        submitter_ref: "user1",
      });
      createTicket({
        subject: "Ticket 2",
        description: "Description 2",
        submitter_ref: "user2",
      });

      expect(listTickets().length).toBe(2);

      resetStore();

      expect(listTickets().length).toBe(0);
    });

    it("allows creating new tickets after reset", () => {
      createTicket({
        subject: "Ticket 1",
        description: "Description 1",
        submitter_ref: "user1",
      });

      resetStore();

      const newTicket = createTicket({
        subject: "New ticket",
        description: "New description",
        submitter_ref: "user2",
      });

      expect(newTicket).toBeDefined();
      expect(listTickets().length).toBe(1);
    });
  });

  describe("seedSampleTickets", () => {
    it("seeds initial sample tickets", () => {
      const tickets = seedSampleTickets();

      expect(tickets.length).toBeGreaterThan(0);
      expect(tickets.length).toBe(3); // Based on SAMPLE_TICKETS array
    });

    it("creates tickets with expected fields", () => {
      resetStore();
      const tickets = seedSampleTickets();

      tickets.forEach((ticket) => {
        expect(ticket.ticket_id).toBeDefined();
        expect(ticket.subject).toBeDefined();
        expect(ticket.description).toBeDefined();
        expect(ticket.submitter_ref).toBeDefined();
        expect(ticket.status).toBeDefined();
        expect(ticket.created_at).toBeDefined();
      });
    });

    it("does not re-seed if tickets already exist", () => {
      const firstSeed = seedSampleTickets();
      const secondSeed = seedSampleTickets();

      expect(firstSeed.length).toBe(secondSeed.length);
      expect(listTickets().length).toBe(firstSeed.length); // Not doubled
    });

    it("creates tickets with correct statuses", () => {
      resetStore();
      const tickets = seedSampleTickets();

      const statuses = tickets.map((t) => t.status);
      expect(statuses).toContain("open");
      expect(statuses).toContain("in_progress");
    });
  });

  describe("Integration tests", () => {
    it("complete ticket lifecycle", async () => {
      // Create ticket
      const ticket = createTicket({
        subject: "Complete lifecycle test",
        description: "Testing the complete lifecycle",
        submitter_ref: "user@example.com",
      });

      // Add log entry
      await addToProcessingLog(ticket.ticket_id, {
        event: "created",
        description: "Ticket created",
      });

      // Update fields
      updateTicketFields(ticket.ticket_id, {
        urgency: "high",
        category: "technical",
      });

      // Add more log entry
      await addToProcessingLog(ticket.ticket_id, {
        event: "assigned",
        description: "Assigned to tech team",
      });

      // Update status
      updateTicketStatus(ticket.ticket_id, "in_progress");

      // Retrieve and verify
      const retrieved = getTicketById(ticket.ticket_id);

      expect(retrieved.subject).toBe("Complete lifecycle test");
      expect(retrieved.urgency).toBe("high");
      expect(retrieved.category).toBe("technical");
      expect(retrieved.status).toBe("in_progress");
      expect(retrieved.ai_processing_log.length).toBe(2);
    });

    it("multiple tickets with different statuses", () => {
      const ticket1 = createTicket({
        subject: "Open",
        description: "Open ticket",
        submitter_ref: "user1",
      });
      const ticket2 = createTicket({
        subject: "In Progress",
        description: "In progress ticket",
        submitter_ref: "user2",
      });
      const ticket3 = createTicket({
        subject: "Closed",
        description: "Closed ticket",
        submitter_ref: "user3",
      });

      updateTicketStatus(ticket2.ticket_id, "in_progress");
      updateTicketStatus(ticket3.ticket_id, "closed");

      const openCount = listTickets({ status: "open" }).length;
      const inProgressCount = listTickets({ status: "in_progress" }).length;
      const closedCount = listTickets({ status: "closed" }).length;

      expect(openCount).toBe(1);
      expect(inProgressCount).toBe(1);
      expect(closedCount).toBe(1);
    });
  });
});
