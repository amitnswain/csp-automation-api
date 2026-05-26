/**
 * Escalation Subagent
 * Detects unresolvable tickets and formats them for human escalation
 */

/**
 * Determine if a ticket should be escalated to human support
 * @param {Object} context - Ticket context and processing results
 * @param {number} context.confidence - Researcher confidence score (0-1)
 * @param {Object} context.triageResult - Results from ticket triage
 * @param {string} context.ticketId - Ticket ID
 * @returns {boolean} True if ticket should be escalated
 */
function shouldEscalateIfNeeded(context) {
  const { confidence, triageResult, ticketId } = context;

  // Escalate if confidence is too low
  if (confidence < 0.4) {
    return true;
  }

  // Escalate for critical issues regardless of confidence (need human judgment)
  if (triageResult && triageResult.urgency === "critical") {
    return true;
  }

  // Escalate certain topic categories that typically require human intervention
  const highEscalationTopics = ["security", "access_request"];
  if (triageResult && highEscalationTopics.includes(triageResult.category)) {
    return true;
  }

  // Escalate if multiple low-confidence indicators
  if (confidence < 0.6 && triageResult && triageResult.urgency === "high") {
    return true;
  }

  return false;
}

/**
 * Format ticket for human escalation with full context
 * @param {Object} escalationData - Information for escalation
 * @param {string} escalationData.ticketId - Ticket ID
 * @param {string} escalationData.reason - Reason for escalation
 * @param {Object} escalationData.context - Full ticket context
 * @returns {Object} Escalation result formatted for human queue
 */
function escalateTicket(escalationData) {
  const { ticketId, reason, context } = escalationData;

  // In a real implementation, this would send to a ticketing system or human queue
  // For this implementation, we return structured data that represents the escalation

  return {
    ticket_id: ticketId,
    escalation_reason: reason,
    escalated_at: new Date().toISOString(),
    context: {
      ticket_info: context.ticketInfo || {},
      triage_result: context.triageResult || {},
      research_result: context.researchResult || {},
      processing_log: context.processingLog || []
    },
    human_agent_notes: "",
    status: "escalated",
    priority: determineEscalationPriority(context)
  };
}

/**
 * Determine priority level for escalated ticket
 * @param {Object} context - Ticket context
 * @returns {string} Priority level (low, medium, high, critical)
 */
function determineEscalationPriority(context) {
  const { triageResult } = context;

  if (!triageResult) {
    return "medium";
  }

  // Inherit urgency level from triage, but adjust based on other factors
  let priority = triageResult.urgency || "medium";

  // Boost priority for security issues
  if (triageResult.category === "security") {
    if (priority === "low") priority = "medium";
    else if (priority === "medium") priority = "high";
    else if (priority === "high") priority = "critical";
  }

  return priority;
}

module.exports = {
  shouldEscalateIfNeeded,
  escalateTicket
};