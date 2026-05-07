const request = require("supertest");
const app = require("../src/app");
const { resetStore } = require("../src/store/ticketStore");

describe("IT Support Ticket API", () => {
  beforeEach(() => {
    resetStore();
  });

  it("creates a ticket successfully", async () => {
    const response = await request(app).post("/tickets").send({
      title: "Laptop not booting",
      description: "The laptop is stuck on BIOS screen",
      requester: "alice",
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        title: "Laptop not booting",
        description: "The laptop is stuck on BIOS screen",
        requester: "alice",
        status: "open",
      }),
    );
    expect(response.body.id).toEqual(expect.any(String));
    expect(response.body.createdAt).toEqual(expect.any(String));
    expect(response.body.updatedAt).toEqual(expect.any(String));
  });

  it("fails when required fields are missing", async () => {
    const response = await request(app).post("/tickets").send({
      title: "Printer issue",
      requester: "bob",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: "Validation failed",
      }),
    );
    expect(response.body.details).toHaveProperty("description");
  });

  it("retrieves all tickets (empty and populated)", async () => {
    const emptyResponse = await request(app).get("/tickets");
    expect(emptyResponse.statusCode).toBe(200);
    expect(emptyResponse.body).toEqual([]);

    await request(app).post("/tickets").send({
      title: "VPN problem",
      description: "Unable to connect to VPN",
      requester: "charlie",
    });

    const populatedResponse = await request(app).get("/tickets");
    expect(populatedResponse.statusCode).toBe(200);
    expect(populatedResponse.body.length).toBe(1);
  });

  it("retrieves a ticket by id and returns 404 for unknown id", async () => {
    const createResponse = await request(app).post("/tickets").send({
      title: "Email access issue",
      description: "Cannot access inbox",
      requester: "diana",
    });
    const { id } = createResponse.body;

    const getByIdResponse = await request(app).get(`/tickets/${id}`);
    expect(getByIdResponse.statusCode).toBe(200);
    expect(getByIdResponse.body.id).toBe(id);

    const notFoundResponse = await request(app).get("/tickets/non-existent-id");
    expect(notFoundResponse.statusCode).toBe(404);
    expect(notFoundResponse.body.message).toBe("Ticket not found");
  });

  it("filters tickets by status", async () => {
    const created = await request(app).post("/tickets").send({
      title: "Monitor flickering",
      description: "Screen flickers every minute",
      requester: "eve",
    });

    await request(app).patch(`/tickets/${created.body.id}/status`).send({
      status: "in_progress",
    });

    const openResponse = await request(app).get("/tickets").query({ status: "open" });
    const inProgressResponse = await request(app).get("/tickets").query({ status: "in_progress" });

    expect(openResponse.statusCode).toBe(200);
    expect(openResponse.body).toEqual([]);
    expect(inProgressResponse.statusCode).toBe(200);
    expect(inProgressResponse.body.length).toBe(1);
    expect(inProgressResponse.body[0].status).toBe("in_progress");
  });

  it("searches tickets by title and description", async () => {
    await request(app).post("/tickets").send({
      title: "Software install request",
      description: "Need Photoshop access",
      requester: "frank",
    });
    await request(app).post("/tickets").send({
      title: "Keyboard replacement",
      description: "Keycaps are broken",
      requester: "grace",
    });

    const response = await request(app).get("/tickets").query({ search: "photoshop" });

    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].title).toBe("Software install request");
  });

  it("updates ticket status and rejects invalid status", async () => {
    const created = await request(app).post("/tickets").send({
      title: "Network outage",
      description: "No internet in office area",
      requester: "henry",
    });

    const updated = await request(app).patch(`/tickets/${created.body.id}/status`).send({
      status: "resolved",
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.body.status).toBe("resolved");

    const invalidStatus = await request(app).patch(`/tickets/${created.body.id}/status`).send({
      status: "invalid",
    });
    expect(invalidStatus.statusCode).toBe(400);
    expect(invalidStatus.body.message).toBe("Validation failed");
  });
});
