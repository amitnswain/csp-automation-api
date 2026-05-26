const TICKET_STATUSES = ["open", "in_progress", "escalated", "closed"];
const STATUS_TRANSITIONS = {
  open: ["in_progress", "escalated", "closed"],
  in_progress: ["escalated", "closed"],
  escalated: ["closed"],
  closed: [],
};

const URGENCY_LEVELS = ["low", "medium", "high", "critical"];
const TOPIC_CATEGORIES = [
  "billing",
  "technical",
  "feature_request",
  "security",
  "access_request",
  "hardware",
  "software",
  "network",
  "other"
];

module.exports = {
  TICKET_STATUSES,
  STATUS_TRANSITIONS,
  URGENCY_LEVELS,
  TOPIC_CATEGORIES,
};