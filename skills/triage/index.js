/**
 * Ticket Triage Skill
 * Classifies incoming tickets by urgency level and topic category
 */

// Urgency classification keywords
const URGENCY_KEYWORDS = {
  critical: [
    "outage", "down", "broken", "urgent", "emergency", "critical", "severe",
    "cannot work", "blocked", "blocking", "production", "prod", "server down",
    "website down", "service down", "access denied", "locked out", "security breach"
  ],
  high: [
    "important", "high", "soon", "today", "asap", "quickly", "immediately",
    "not working", "failed", "failure", "error", "issue", "problem",
    "login issue", "password reset", "access issue"
  ],
  medium: [
    "medium", "normal", "moderate", "when possible", "soonish",
    "question", "help", "assistance", "guidance"
  ],
  low: [
    "low", "minor", "minimal", "whenever", "no rush", "when you have time",
    "suggestion", "idea", "enhancement", "nice to have"
  ]
};

// Topic classification keywords
const TOPIC_KEYWORDS = {
  billing: [
    "invoice", "payment", "bill", "charge", "cost", "price", "subscription",
    "renewal", "refund", "billing", "payment failed", "credit card"
  ],
  technical: [
    "error", "bug", "crash", "freeze", "hang", "slow", "performance",
    "timeout", "exception", "stack trace", "debug", "technical", "technology"
  ],
  feature_request: [
    "feature", "request", "enhancement", "improvement", "add", "new",
    "suggestion", "idea", "would be nice", "could you add", "request for"
  ],
  security: [
    "security", "secure", "vulnerability", "breach", "hack", "hacked",
    "virus", "malware", "phishing", "suspicious", "unauthorized", "access",
    "password", "authentication", "auth", "login", "account compromised"
  ],
  access_request: [
    "access", "permission", "permit", "grant", "allow", "need access",
    "can't access", "no access", "locked out", "permission denied",
    "admin access", "root access", "user access"
  ],
  hardware: [
    "hardware", "device", "laptop", "desktop", "computer", "mouse", "keyboard",
    "monitor", "screen", "printer", "scanner", "camera", "headset", "usb",
    "drive", "disk", "memory", "ram", "cpu", "processor"
  ],
  software: [
    "software", "application", "app", "program", "install", "installation",
    "update", "upgrade", "download", "windows", "macos", "linux", "office",
    "outlook", "teams", "zoom", "slack", "browser", "chrome", "firefox"
  ],
  network: [
    "network", "wifi", "internet", "connection", "connect", "disconnected",
    "vpn", "proxy", "firewall", "port", "ip address", "dns", "router",
    "switch", "ethernet", "cable", "lan", "wan", "bandwidth"
  ],
  other: [
    "general", "question", "help", "support", "assistance", "info",
    "information", "clarification", "explanation", "how to"
  ]
};

/**
 * Classify ticket urgency based on title and description
 * @param {string} title - Ticket title
 * @param {string} description - Ticket description
 * @returns {string} Urgency level (low, medium, high, critical)
 */
function classifyUrgency(title, description) {
  const text = `${title} ${description}`.toLowerCase();

  // Check for critical keywords first
  for (const keyword of URGENCY_KEYWORDS.critical) {
    if (text.includes(keyword)) {
      return "critical";
    }
  }

  // Check for high urgency keywords
  for (const keyword of URGENCY_KEYWORDS.high) {
    if (text.includes(keyword)) {
      return "high";
    }
  }

  // Check for low urgency keywords
  for (const keyword of URGENCY_KEYWORDS.low) {
    if (text.includes(keyword)) {
      return "low";
    }
  }

  // Default to medium if no specific keywords found
  return "medium";
}

/**
 * Classify ticket topic based on title and description
 * @param {string} title - Ticket title
 * @param {string} description - Ticket description
 * @returns {string} Topic category
 */
function classifyTopic(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  const topicScores = {};

  // Initialize scores for all topics
  for (const topic of Object.keys(TOPIC_KEYWORDS)) {
    topicScores[topic] = 0;
  }

  // Score each topic based on keyword matches
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        topicScores[topic]++;
      }
    }
  }

  // Find the topic with the highest score
  let maxScore = 0;
  let topTopic = "other"; // Default fallback

  for (const [topic, score] of Object.entries(topicScores)) {
    if (score > maxScore) {
      maxScore = score;
      topTopic = topic;
    }
  }

  return topTopic;
}

/**
 * Main triage function that classifies a ticket
 * @param {Object} ticketData - Ticket information
 * @param {string} ticketData.subject - Ticket subject (one-line summary)
 * @param {string} ticketData.description - Ticket description
 * @param {string} ticketData.submitter_ref - Ticket submitter reference
 * @returns {Object} Triage result with urgency and category
 */
async function triageTicket(ticketData) {
  const { subject, description, submitter_ref } = ticketData;

  // Classify urgency
  const urgency = classifyUrgency(subject, description);

  // Classify topic
  const category = classifyTopic(subject, description);

  // Return machine-readable result
  return {
    urgency: urgency,
    category: category,
    classified_at: new Date().toISOString(),
    confidence: 0.85 // Simulated confidence score for rule-based classification
  };
}

module.exports = {
  triageTicket
};