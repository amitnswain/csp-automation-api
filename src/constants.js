const TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"];

const STATUS_TRANSITIONS = {
  open: ["in_progress", "resolved", "closed"],
  in_progress: ["resolved", "closed"],
  resolved: ["closed", "in_progress"],
  closed: [],
};

module.exports = {
  TICKET_STATUSES,
  STATUS_TRANSITIONS,
};
