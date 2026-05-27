const { ApiError, notFoundHandler, errorHandler } = require("../src/errors");

describe("Error Classes and Handlers", () => {
  describe("ApiError", () => {
    it("creates an error with statusCode, message, and details", () => {
      const error = new ApiError(400, "Validation failed", { field: "error message" });

      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("Validation failed");
      expect(error.details).toEqual({ field: "error message" });
    });

    it("inherits from Error class", () => {
      const error = new ApiError(500, "Server error");

      expect(error instanceof Error).toBe(true);
      expect(error.name).toBe("ApiError");
    });

    it("creates error with undefined details", () => {
      const error = new ApiError(404, "Not found");

      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("Not found");
      expect(error.details).toBeUndefined();
    });

    it("supports different status codes", () => {
      const errors = [
        new ApiError(400, "Bad request"),
        new ApiError(401, "Unauthorized"),
        new ApiError(403, "Forbidden"),
        new ApiError(404, "Not found"),
        new ApiError(500, "Internal server error"),
      ];

      errors.forEach((error, index) => {
        expect(error.statusCode).toBe([400, 401, 403, 404, 500][index]);
      });
    });

    it("captures stack trace", () => {
      const error = new ApiError(400, "Error with stack");

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe("string");
      expect(error.stack.length).toBeGreaterThan(0);
    });
  });

  describe("notFoundHandler", () => {
    it("calls next with 404 ApiError", () => {
      const next = jest.fn();
      const req = {};
      const res = {};

      notFoundHandler(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("Route not found");
    });

    it("ignores request and response objects", () => {
      const next = jest.fn();
      const req = { method: "GET", url: "/test" };
      const res = { status: jest.fn() };

      notFoundHandler(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("errorHandler", () => {
    it("handles ApiError with statusCode and details", () => {
      const res = {
        status: jest.fn().mockReturnValue({ json: jest.fn() }),
        json: jest.fn(),
      };
      const error = new ApiError(400, "Validation failed", { field: "required" });
      const next = jest.fn();

      errorHandler(error, {}, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.status().json).toHaveBeenCalledWith({
        message: "Validation failed",
        details: { field: "required" },
      });
    });

    it("handles ApiError without details", () => {
      const res = {
        status: jest.fn().mockReturnValue({ json: jest.fn() }),
      };
      const error = new ApiError(404, "Not found");

      errorHandler(error, {}, res, null);

      expect(res.status).toHaveBeenCalledWith(404);
      const responseBody = res.status().json.mock.calls[0][0];
      expect(responseBody).toEqual({ message: "Not found" });
      expect(responseBody.details).toBeUndefined();
    });

    it("handles generic Error with 500 statusCode", () => {
      const res = {
        status: jest.fn().mockReturnValue({ json: jest.fn() }),
      };
      const error = new Error("Unexpected error");

      errorHandler(error, {}, res, null);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.status().json).toHaveBeenCalledWith({
        message: "Unexpected error",
      });
    });

    it("uses default message for error without message", () => {
      const res = {
        status: jest.fn().mockReturnValue({ json: jest.fn() }),
      };
      const error = {};

      errorHandler(error, {}, res, null);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.status().json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });

    it("handles 404 errors", () => {
      const res = {
        status: jest.fn().mockReturnValue({ json: jest.fn() }),
      };
      const error = new ApiError(404, "Ticket not found");

      errorHandler(error, {}, res, null);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("handles 401 errors", () => {
      const res = {
        status: jest.fn().mockReturnValue({ json: jest.fn() }),
      };
      const error = new ApiError(401, "Unauthorized");

      errorHandler(error, {}, res, null);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("handles 400 validation errors with multiple details", () => {
      const res = {
        status: jest.fn().mockReturnValue({ json: jest.fn() }),
      };
      const error = new ApiError(400, "Validation failed", {
        subject: "Subject is required",
        description: "Description must not be empty",
        urgency: "Invalid urgency level",
      });

      errorHandler(error, {}, res, null);

      expect(res.status).toHaveBeenCalledWith(400);
      const responseBody = res.status().json.mock.calls[0][0];
      expect(responseBody.details).toHaveProperty("subject");
      expect(responseBody.details).toHaveProperty("description");
      expect(responseBody.details).toHaveProperty("urgency");
      expect(Object.keys(responseBody.details).length).toBe(3);
    });

    it("ignores next parameter", () => {
      const res = {
        status: jest.fn().mockReturnValue({ json: jest.fn() }),
      };
      const error = new ApiError(400, "Error");
      const next = jest.fn();

      errorHandler(error, {}, res, next);

      expect(next).not.toHaveBeenCalled();
    });
  });
});
