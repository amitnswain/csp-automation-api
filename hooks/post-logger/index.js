/**
 * Response Post-Hook
 * Writes structured log entries after every AI response for audit and quality assurance
 */

// In-memory log storage (in production, this would be a database or file system)
const processingLogs = [];

/**
 * Log entry structure
 */
class LogEntry {
  /**
   * @param {Object} options - Log entry options
   * @param {string} options.ticket_id - Ticket ID
   * @param {string} options.event - Type of event being logged
   * @param {*} options.data - Event-specific data
   * @param {string} options.timestamp - ISO timestamp (auto-generated if not provided)
   */
  constructor({ ticket_id, event, data, timestamp }) {
    this.ticket_id = ticket_id;
    this.event = event;
    this.data = data;
    this.timestamp = timestamp || new Date().toISOString();
  }
}

/**
 * Add a log entry to the processing logs
 * @param {LogEntry} entry - Log entry to add
 * @returns {LogEntry} The added log entry
 */
function addLogEntry(entry) {
  const logEntry = new LogEntry(entry);
  processingLogs.push(logEntry);
  return logEntry;
}

/**
 * Get log entries for a specific ticket
 * @param {string} ticketId - Ticket ID to filter by
 * @returns {Array} Array of log entries for the ticket
 */
function getLogsByTicketId(ticketId) {
  return processingLogs.filter(entry => entry.ticket_id === ticketId);
}

/**
 * Get all log entries (optionally limited)
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of entries to return
 * @param {string} options.event - Filter by event type
 * @param {string} options.ticket_id - Filter by ticket ID
 * @param {number} options.offset - Number of entries to skip
 * @returns {Array} Array of log entries
 */
function getAllLogs(options = {}) {
  let filteredLogs = [...processingLogs];

  // Filter by ticket ID if specified
  if (options.ticket_id) {
    filteredLogs = filteredLogs.filter(entry => entry.ticket_id === options.ticket_id);
  }

  // Filter by event type if specified
  if (options.event) {
    filteredLogs = filteredLogs.filter(entry => entry.event === options.event);
  }

  // Sort by timestamp descending (newest first)
  filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Apply offset and limit
  if (options.offset !== undefined) {
    filteredLogs = filteredLogs.slice(options.offset);
  }
  if (options.limit !== undefined) {
    filteredLogs = filteredLogs.slice(0, options.limit);
  }

  return filteredLogs;
}

/**
 * Clear all logs (mainly for testing)
 * @returns {number} Number of logs cleared
 */
function clearAllLogs() {
  const count = processingLogs.length;
  processingLogs.length = 0;
  return count;
}

/**
 * Main response post-hook function
 * Logs structured entry after AI response generation
 * @param {Object} logData - Data to log
 * @param {string} logData.ticket_id - Ticket ID
 * @param {string} logData.response_reference - Reference to the AI response
 * @param {number} logData.confidence_score - Confidence score of AI response (0-1)
 * @param {string} logData.response_type - Type of response (draft, final, etc.)
 * @returns {LogEntry} The created log entry
 */
async function postLoggerHook(logData) {
  const { ticket_id, response_reference, confidence_score, response_type = "ai_response" } = logData;

  // Validate required fields
  if (!ticket_id) {
    throw new Error("ticket_id is required for post-logger hook");
  }

  if (response_reference === undefined) {
    throw new Error("response_reference is required for post-logger hook");
  }

  if (confidence_score === undefined || typeof confidence_score !== "number" || confidence_score < 0 || confidence_score > 1) {
    throw new Error("confidence_score must be a number between 0 and 1");
  }

  // Create structured log entry
  const logEntry = await addLogEntry({
    ticket_id: ticket_id,
    event: "ai_response_generated",
    data: {
      response_type: response_type,
      response_reference: response_reference,
      confidence_score: confidence_score,
      response_length: response_reference ? String(response_reference).length : 0,
      has_response: !!response_reference
    }
  });

  return logEntry;
}

/**
 * Log ticket processing events (triage, research, escalation, etc.)
 * @param {Object} eventData - Event data to log
 * @param {string} eventData.ticket_id - Ticket ID
 * @param {string} eventData.event - Event type (triage_completed, research_completed, etc.)
 * @param {*} eventData.data - Event-specific data
 * @returns {LogEntry} The created log entry
 */
async function logProcessingEvent(eventData) {
  const { ticket_id, event, data } = eventData;

  if (!ticket_id || !event) {
    throw new Error("ticket_id and event are required for processing event logging");
  }

  return await addLogEntry({
    ticket_id: ticket_id,
    event: event,
    data: data || {}
  });
}

module.exports = {
  postLoggerHook,
  logProcessingEvent,
  addLogEntry,
  getLogsByTicketId,
  getAllLogs,
  clearAllLogs,
  LogEntry
};