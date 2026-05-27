const {
  validateCreateTicketBody,
  validateListFilters,
  validateStatusUpdateBody,
  validateUrgencyLevel,
  validateTopicCategory,
  validateResearcherConfidence,
  validatePiiRedacted,
} = require("../src/validation");
const { ApiError } = require("../src/errors");
const { URGENCY_LEVELS, TOPIC_CATEGORIES, TICKET_STATUSES } = require("../src/constants");

describe("Validation Functions", () => {
  describe("validateCreateTicketBody", () => {
    it("passes with valid ticket body", () => {
      const validBody = {
        subject: "Test issue",
        description: "This is a test description",
        submitter_ref: "user@example.com",
      };
      expect(() => validateCreateTicketBody(validBody)).not.toThrow();
    });

    it("throws error for missing subject", () => {
      const invalidBody = {
        description: "Test description",
        submitter_ref: "user@example.com",
      };
      expect(() => validateCreateTicketBody(invalidBody)).toThrow(ApiError);
      try {
        validateCreateTicketBody(invalidBody);
      } catch (error) {
        expect(error.details).toHaveProperty("subject");
      }
    });

    it("throws error for empty subject", () => {
      const invalidBody = {
        subject: "   ",
        description: "Test description",
        submitter_ref: "user@example.com",
      };
      expect(() => validateCreateTicketBody(invalidBody)).toThrow(ApiError);
    });

    it("throws error for missing description", () => {
      const invalidBody = {
        subject: "Test issue",
        submitter_ref: "user@example.com",
      };
      expect(() => validateCreateTicketBody(invalidBody)).toThrow(ApiError);
      try {
        validateCreateTicketBody(invalidBody);
      } catch (error) {
        expect(error.details).toHaveProperty("description");
      }
    });

    it("throws error for missing submitter_ref", () => {
      const invalidBody = {
        subject: "Test issue",
        description: "Test description",
      };
      expect(() => validateCreateTicketBody(invalidBody)).toThrow(ApiError);
      try {
        validateCreateTicketBody(invalidBody);
      } catch (error) {
        expect(error.details).toHaveProperty("submitter_ref");
      }
    });

    it("throws error for non-object body", () => {
      expect(() => validateCreateTicketBody(null)).toThrow(ApiError);
      expect(() => validateCreateTicketBody(undefined)).toThrow(ApiError);
      expect(() => validateCreateTicketBody("string")).toThrow(ApiError);
      expect(() => validateCreateTicketBody(123)).toThrow(ApiError);
    });

    it("throws error for non-string fields", () => {
      const invalidBody = {
        subject: 123,
        description: "Test description",
        submitter_ref: "user@example.com",
      };
      expect(() => validateCreateTicketBody(invalidBody)).toThrow(ApiError);
    });
  });

  describe("validateListFilters", () => {
    it("passes with no filters", () => {
      expect(() => validateListFilters(null)).not.toThrow();
      expect(() => validateListFilters(undefined)).not.toThrow();
      expect(() => validateListFilters({})).not.toThrow();
    });

    it("passes with valid status filter", () => {
      expect(() => validateListFilters({ status: "open" })).not.toThrow();
      expect(() => validateListFilters({ status: "closed" })).not.toThrow();
      expect(() => validateListFilters({ status: "in_progress" })).not.toThrow();
    });

    it("throws error for invalid status filter", () => {
      expect(() => validateListFilters({ status: "invalid_status" })).toThrow(ApiError);
      expect(() => validateListFilters({ status: "pending" })).toThrow(ApiError);
    });

    it("passes with valid urgency filter", () => {
      expect(() => validateListFilters({ urgency: "low" })).not.toThrow();
      expect(() => validateListFilters({ urgency: "critical" })).not.toThrow();
    });

    it("throws error for invalid urgency filter", () => {
      expect(() => validateListFilters({ urgency: "invalid_urgency" })).toThrow(ApiError);
    });

    it("passes with valid category filter", () => {
      expect(() => validateListFilters({ category: "technical" })).not.toThrow();
      expect(() => validateListFilters({ category: "billing" })).not.toThrow();
    });

    it("throws error for invalid category filter", () => {
      expect(() => validateListFilters({ category: "invalid_category" })).toThrow(ApiError);
    });

    it("passes with valid search string", () => {
      expect(() => validateListFilters({ search: "keyword" })).not.toThrow();
      expect(() => validateListFilters({ search: "" })).not.toThrow();
    });

    it("throws error for non-string search", () => {
      expect(() => validateListFilters({ search: 123 })).toThrow(ApiError);
      expect(() => validateListFilters({ search: null })).toThrow(ApiError);
    });

    it("passes with multiple valid filters", () => {
      expect(() =>
        validateListFilters({
          status: "open",
          urgency: "high",
          category: "technical",
          search: "wifi",
        })
      ).not.toThrow();
    });

    it("throws error with mix of valid and invalid filters", () => {
      expect(() =>
        validateListFilters({
          status: "open",
          urgency: "invalid",
        })
      ).toThrow(ApiError);
    });
  });

  describe("validateStatusUpdateBody", () => {
    it("passes with valid status transition from open", () => {
      expect(() => validateStatusUpdateBody({ status: "in_progress" }, "open")).not.toThrow();
      expect(() => validateStatusUpdateBody({ status: "escalated" }, "open")).not.toThrow();
      expect(() => validateStatusUpdateBody({ status: "closed" }, "open")).not.toThrow();
    });

    it("passes with valid status transition from in_progress", () => {
      expect(() => validateStatusUpdateBody({ status: "escalated" }, "in_progress")).not.toThrow();
      expect(() => validateStatusUpdateBody({ status: "closed" }, "in_progress")).not.toThrow();
    });

    it("passes with valid status transition from escalated", () => {
      expect(() => validateStatusUpdateBody({ status: "closed" }, "escalated")).not.toThrow();
    });

    it("throws error for invalid status transition", () => {
      expect(() => validateStatusUpdateBody({ status: "in_progress" }, "escalated")).toThrow(ApiError);
      expect(() => validateStatusUpdateBody({ status: "open" }, "in_progress")).toThrow(ApiError);
    });

    it("throws error when trying to set same status", () => {
      expect(() => validateStatusUpdateBody({ status: "open" }, "open")).toThrow(ApiError);
      expect(() => validateStatusUpdateBody({ status: "closed" }, "closed")).toThrow(ApiError);
    });

    it("throws error for invalid status value", () => {
      expect(() => validateStatusUpdateBody({ status: "invalid_status" }, "open")).toThrow(ApiError);
    });

    it("throws error for non-object body", () => {
      expect(() => validateStatusUpdateBody(null, "open")).toThrow(ApiError);
      expect(() => validateStatusUpdateBody("string", "open")).toThrow(ApiError);
    });

    it("throws error for closed ticket with no transitions allowed", () => {
      expect(() => validateStatusUpdateBody({ status: "open" }, "closed")).toThrow(ApiError);
      expect(() => validateStatusUpdateBody({ status: "in_progress" }, "closed")).toThrow(ApiError);
    });
  });

  describe("validateUrgencyLevel", () => {
    it("passes with valid urgency levels", () => {
      expect(() => validateUrgencyLevel({ urgency: "low" })).not.toThrow();
      expect(() => validateUrgencyLevel({ urgency: "medium" })).not.toThrow();
      expect(() => validateUrgencyLevel({ urgency: "high" })).not.toThrow();
      expect(() => validateUrgencyLevel({ urgency: "critical" })).not.toThrow();
    });

    it("passes with undefined urgency", () => {
      expect(() => validateUrgencyLevel({ urgency: undefined })).not.toThrow();
      expect(() => validateUrgencyLevel({})).not.toThrow();
    });

    it("throws error for invalid urgency level", () => {
      expect(() => validateUrgencyLevel({ urgency: "invalid" })).toThrow(ApiError);
      expect(() => validateUrgencyLevel({ urgency: "urgent" })).toThrow(ApiError);
    });

    it("throws error for non-string urgency", () => {
      expect(() => validateUrgencyLevel({ urgency: 123 })).toThrow(ApiError);
    });

    it("throws error for non-object body", () => {
      expect(() => validateUrgencyLevel(null)).toThrow(ApiError);
      expect(() => validateUrgencyLevel("string")).toThrow(ApiError);
    });
  });

  describe("validateTopicCategory", () => {
    it("passes with valid categories", () => {
      TOPIC_CATEGORIES.forEach((category) => {
        expect(() => validateTopicCategory({ category })).not.toThrow();
      });
    });

    it("passes with undefined category", () => {
      expect(() => validateTopicCategory({ category: undefined })).not.toThrow();
      expect(() => validateTopicCategory({})).not.toThrow();
    });

    it("throws error for invalid category", () => {
      expect(() => validateTopicCategory({ category: "invalid_category" })).toThrow(ApiError);
      expect(() => validateTopicCategory({ category: "support" })).toThrow(ApiError);
    });

    it("throws error for non-string category", () => {
      expect(() => validateTopicCategory({ category: 123 })).toThrow(ApiError);
    });

    it("throws error for non-object body", () => {
      expect(() => validateTopicCategory(null)).toThrow(ApiError);
    });
  });

  describe("validateResearcherConfidence", () => {
    it("passes with valid confidence scores", () => {
      expect(() => validateResearcherConfidence({ confidence_score: 0 })).not.toThrow();
      expect(() => validateResearcherConfidence({ confidence_score: 0.5 })).not.toThrow();
      expect(() => validateResearcherConfidence({ confidence_score: 1 })).not.toThrow();
      expect(() => validateResearcherConfidence({ confidence_score: 0.75 })).not.toThrow();
    });

    it("passes with undefined confidence score", () => {
      expect(() => validateResearcherConfidence({ confidence_score: undefined })).not.toThrow();
      expect(() => validateResearcherConfidence({})).not.toThrow();
    });

    it("throws error for confidence score below 0", () => {
      expect(() => validateResearcherConfidence({ confidence_score: -0.1 })).toThrow(ApiError);
      expect(() => validateResearcherConfidence({ confidence_score: -1 })).toThrow(ApiError);
    });

    it("throws error for confidence score above 1", () => {
      expect(() => validateResearcherConfidence({ confidence_score: 1.1 })).toThrow(ApiError);
      expect(() => validateResearcherConfidence({ confidence_score: 2 })).toThrow(ApiError);
    });

    it("throws error for non-number confidence score", () => {
      expect(() => validateResearcherConfidence({ confidence_score: "0.5" })).toThrow(ApiError);
      expect(() => validateResearcherConfidence({ confidence_score: null })).toThrow(ApiError);
    });

    it("throws error for non-object body", () => {
      expect(() => validateResearcherConfidence(null)).toThrow(ApiError);
    });
  });

  describe("validatePiiRedacted", () => {
    it("passes with valid boolean values", () => {
      expect(() => validatePiiRedacted({ pii_redacted: true })).not.toThrow();
      expect(() => validatePiiRedacted({ pii_redacted: false })).not.toThrow();
    });

    it("passes with undefined pii_redacted", () => {
      expect(() => validatePiiRedacted({ pii_redacted: undefined })).not.toThrow();
      expect(() => validatePiiRedacted({})).not.toThrow();
    });

    it("throws error for non-boolean pii_redacted", () => {
      expect(() => validatePiiRedacted({ pii_redacted: "true" })).toThrow(ApiError);
      expect(() => validatePiiRedacted({ pii_redacted: 1 })).toThrow(ApiError);
      expect(() => validatePiiRedacted({ pii_redacted: null })).toThrow(ApiError);
    });

    it("throws error for non-object body", () => {
      expect(() => validatePiiRedacted(null)).toThrow(ApiError);
    });
  });
});
