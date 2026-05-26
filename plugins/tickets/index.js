/**
 * Tickets Plugin
 * Provides intent mappings and plugin structure for ticket operations
 */

/**
 * Intent mappings define how the system should respond to different ticket characteristics
 * These can be used by AI systems to determine appropriate actions
 */
const INTENT_MAPPINGS = {
  // Urgency-based intents
  urgency_intents: {
    critical: {
      primary_intent: "IMMEDIATE_ESCALATION",
      description: "System-wide outage, security breach, or blocking issue requiring immediate human intervention",
      typical_resolution_time: "15 minutes",
      required_roles: ["SECURITY_TEAM", "NETWORK_ADMIN", "SYSTEM_ADMIN"],
      auto_resolution_possible: false
    },
    high: {
      primary_intent: "EXPEDITED_RESOLUTION",
      description: "Urgent issue preventing work that should be resolved within business day",
      typical_resolution_time: "4 hours",
      required_roles: ["TECHNICAL_SUPPORT", "SYSTEM_ADMIN"],
      auto_resolution_possible: true
    },
    medium: {
      primary_intent: "STANDARD_PROCESSING",
      description: "Normal priority issue to be processed in queue",
      typical_resolution_time: "1 business day",
      required_roles: ["TECHNICAL_SUPPORT"],
      auto_resolution_possible: true
    },
    low: {
      primary_intent: "SELF_SERVICE_OR_SCHEDULED",
      description: "Minor issue or suggestion that may be addressed via self-service or scheduled maintenance",
      typical_resolution_time: "3-5 business days",
      required_roles: ["SELF_SERVICE_PORTAL", "TECHNICAL_SUPPORT"],
      auto_resolution_possible: true
    }
  },

  // Topic-based intents
  topic_intents: {
    billing: {
      primary_intent: "BILLING_INQUIRY",
      description: "Question or concern about charges, invoices, or subscription",
      typical_resolution_time: "1 business day",
      required_roles: ["BILLING_SPECIALIST"],
      auto_resolution_possible: true,
      knowledge_base_priority: ["billing", "account_management"]
    },
    technical: {
      primary_intent: "TECHNICAL_TROUBLESHOOTING",
      description: "Technical issue requiring diagnostic and resolution steps",
      typical_resolution_time: "4 hours",
      required_roles: ["TECHNICAL_SUPPORT", "SYSTEM_ADMIN"],
      auto_resolution_possible: true,
      knowledge_base_priority: ["technical", "software", "hardware"]
    },
    feature_request: {
      primary_intent: "PRODUCT_FEEDBACK",
      description: "Request for new feature or enhancement to existing functionality",
      typical_resolution_time: "10 business days (for review)",
      required_roles: ["PRODUCT_MANAGER", "DEVELOPMENT_TEAM"],
      auto_resolution_possible: false,
      knowledge_base_priority: ["feature_request", "product_documentation"]
    },
    security: {
      primary_intent: "SECURITY_INCIDENT",
      description: "Security concern, vulnerability report, or suspicious activity",
      typical_resolution_time: "15 minutes",
      required_roles: ["SECURITY_TEAM", "INCIDENT_RESPONSE"],
      auto_resolution_possible: false,
      knowledge_base_priority: ["security", "incident_response", "policies"]
    },
    access_request: {
      primary_intent: "PERMISSION_MANAGEMENT",
      description: "Request for system access, permissions, or account modifications",
      typical_resolution_time: "2 business days",
      required_roles: ["SECURITY_TEAM", "SYSTEM_ADMIN", "HELPDESK_LEAD"],
      auto_resolution_possible: true,
      knowledge_base_priority: ["access_request", "permissions", "security_policies"]
    },
    hardware: {
      primary_intent: "HARDWARE_SUPPORT",
      description: "Physical device issue requiring diagnostic, repair, or replacement",
      typical_resolution_time: "4 hours",
      required_roles: ["HARDWARE_TECHNICIAN", "FIELD_SUPPORT"],
      auto_resolution_possible: true,
      knowledge_base_priority: ["hardware", "warranty", "maintenance"]
    },
    software: {
      primary_intent: "SOFTWARE_SUPPORT",
      description: "Application installation, update, configuration, or compatibility issue",
      typical_resolution_time: "2 hours",
      required_roles: ["APPLICATION_SUPPORT", "SYSTEM_ADMIN"],
      auto_resolution_possible: true,
      knowledge_base_priority: ["software", "installation", "updates", "licensing"]
    },
    network: {
      primary_intent: "NETWORK_CONNECTIVITY",
      description: "Network, internet, or connectivity issue affecting access to services",
      typical_resolution_time: "2 hours",
      required_roles: ["NETWORK_TEAM", "HELPDESK"],
      auto_resolution_possible: true,
      knowledge_base_priority: ["network", "vpn", "wifi", "connectivity"]
    },
    other: {
      primary_intent: "GENERAL_INQUIRY",
      description: "General question or request not fitting specific categories",
      typical_resolution_time: "1 business day",
      required_roles: ["HELPDESK_TIER_1"],
      auto_resolution_possible: true,
      knowledge_base_priority: ["general", "faq", "troubleshooting"]
    }
  },

  // Confidence-based intents
  confidence_intents: {
    high_confidence: {
      threshold: 0.8,
      primary_intent: "AUTO_RESOLUTION",
      description: "High confidence AI response suitable for automatic delivery to user",
      human_review_required: false,
      notification_type: "direct_response"
    },
    medium_confidence: {
      threshold: 0.5,
      primary_intent: "AI_ASSISTED",
      description: "Moderate confidence response that benefits from human review before sending",
      human_review_required: true,
      notification_type: "review_then_send"
    },
    low_confidence: {
      threshold: 0.0,
      primary_intent: "HUMAN_REQUIRED",
      description: "Low confidence response requiring human investigation and custom response",
      human_review_required: true,
      notification_type: "human_generated"
    }
  }
};

/**
 * Get intent mapping for urgency level
 * @param {string} urgency - Urgency level (low, medium, high, critical)
 * @returns {Object} Intent mapping for the urgency level
 */
function getUrgencyIntent(urgency) {
  return INTENT_MAPPINGS.urgency_intents[urgency] || INTENT_MAPPINGS.urgency_intents.medium;
}

/**
 * Get intent mapping for topic category
 * @param {string} category - Topic category
 * @returns {Object} Intent mapping for the topic category
 */
function getTopicIntent(category) {
  return INTENT_MAPPINGS.topic_intents[category] || INTENT_MAPPINGS.topic_intents.other;
}

/**
 * Get intent mapping for confidence score
 * @param {number} confidenceScore - Confidence score (0-1)
 * @returns {Object} Intent mapping for the confidence level
 */
function getConfidenceIntent(confidenceScore) {
  if (confidenceScore >= INTENT_MAPPINGS.confidence_intents.high_confidence.threshold) {
    return INTENT_MAPPINGS.confidence_intents.high_confidence;
  } else if (confidenceScore >= INTENT_MAPPINGS.confidence_intents.medium_confidence.threshold) {
    return INTENT_MAPPINGS.confidence_intents.medium_confidence;
  } else {
    return INTENT_MAPPINGS.confidence_intents.low_confidence;
  }
}

/**
 * Determine recommended action based on ticket characteristics
 * @param {Object} ticket - Ticket object with urgency, topic, and confidence data
 * @returns {Object} Recommended action and metadata
 */
function getRecommendedAction(ticket) {
  const { urgency, category, confidence_score } = ticket;

  const urgencyIntent = getUrgencyIntent(urgency);
  const topicIntent = getTopicIntent(category);
  const confidenceIntent = getConfidenceIntent(confidence_score || 0);

  // Determine if human review is required based on multiple factors
  let humanReviewRequired = false;
  let primaryIntent = "PROCESS_NORMALLY";

  // Critical urgency always requires human attention
  if (urgency === "critical") {
    humanReviewRequired = true;
    primaryIntent = urgencyIntent.primary_intent;
  }
  // Low confidence requires human review
  else if (confidenceIntent.human_review_required) {
    humanReviewRequired = true;
    primaryIntent = confidenceIntent.primary_intent;
  }
  // Certain topics always benefit from human review
  else if (["security", "access_request"].includes(category)) {
    humanReviewRequired = true;
    primaryIntent = topicIntent.primary_intent;
  }
  // Otherwise follow confidence-based guidance
  else {
    humanReviewRequired = confidenceIntent.human_review_required;
    primaryIntent = confidenceIntent.primary_intent;
  }

  return {
    primary_intent: primaryIntent,
    human_review_required: humanReviewRequired,
    urgency_intent: urgencyIntent,
    topic_intent: topicIntent,
    confidence_intent: confidenceIntent,
    estimated_effort: calculateEstimatedEffort(ticket),
    suggested_next_steps: getSuggestedNextSteps(ticket, humanReviewRequired)
  };
}

/**
 * Calculate estimated effort based on ticket characteristics
 * @param {Object} ticket - Ticket object
 * @returns {string} Estimated effort level (low, medium, high)
 */
function calculateEstimatedEffort(ticket) {
  const { urgency, category, confidence_score } = ticket;
  let effortScore = 0;

  // Urgency contributes to effort (higher urgency = more immediate effort needed)
  const urgencyScores = { critical: 3, high: 2, medium: 1, low: 0 };
  effortScore += urgencyScores[urgency] || 1;

  // Topic complexity affects effort
  const complexTopics = ["security", "access_request", "hardware"];
  if (complexTopics.includes(category)) {
    effortScore += 2;
  }

  // Low confidence may require more investigation effort
  if (confidence_score < 0.5) {
    effortScore += 1;
  }

  // Convert score to effort level
  if (effortScore >= 5) return "high";
  if (effortScore >= 3) return "medium";
  return "low";
}

/**
 * Get suggested next steps for ticket processing
 * @param {Object} ticket - Ticket object
 * @param {boolean} humanReviewRequired - Whether human review is required
 * @returns {Array} Suggested next steps
 */
function getSuggestedNextSteps(ticket, humanReviewRequired) {
  const steps = [];
  const { urgency, category, confidence_score, status } = ticket;

  // Always start with understanding the issue
  steps.push("Review ticket description and gather additional context if needed");

  // Add urgency-specific steps
  if (urgency === "critical") {
    steps.push("Immediately notify appropriate escalation contacts");
    steps.push("Begin initial assessment while awaiting specialist response");
  } else if (urgency === "high") {
    steps.push("Prioritize in queue for same-day attention");
  }

  // Add topic-specific steps
  switch (category) {
    case "billing":
      steps.push("Review account details and recent transactions");
      steps.push("Check for prorated charges or usage discrepancies");
      break;
    case "technical":
      steps.push("Attempt to reproduce issue if possible");
      steps.push("Check system logs for error messages");
      steps.push("Verify user has tried basic troubleshooting");
      break;
    case "security":
      steps.push("Follow security incident response procedures");
      steps.push("Preserve any evidence for investigation");
      steps.push("Contact security team lead");
      break;
    case "access_request":
      steps.push("Verify manager approval for access request");
      steps.push("Check principle of least privilege compliance");
      steps.push("Validate requested access against job requirements");
      break;
    case "hardware":
      steps.push("Run hardware diagnostics if available");
      steps.push("Check warranty status and service history");
      steps.push("Determine if on-site visit or shipment required");
      break;
  }

  // Add confidence-specific steps
  if (humanReviewRequired) {
    steps.push("Review AI-generated draft response for accuracy");
    steps.push("Customize response based on specific circumstances");
    steps.push("Add any additional troubleshooting steps as needed");
  } else {
    steps.push("Review AI-generated response for completeness");
    steps.push("Personalize response with user-specific details");
    steps.push("Send response to user and monitor for follow-up");
  }

  // Add status-specific steps
  if (status === "escalated") {
    steps.push("Add notes to ticket for human agent taking over");
    steps.push("Ensure all relevant context is transferred");
  }

  // Always end with closure steps
  steps.push("Document resolution steps taken");
  steps.push("Follow up with user to confirm issue resolved");
  steps.push("Update knowledge base if new information discovered");

  return steps;
}

/**
 * Main plugin interface
 */
const TicketsPlugin = {
  INTENT_MAPPINGS,
  getUrgencyIntent,
  getTopicIntent,
  getConfidenceIntent,
  getRecommendedAction,
  calculateEstimatedEffort,
  getSuggestedNextSteps
};

module.exports = TicketsPlugin;