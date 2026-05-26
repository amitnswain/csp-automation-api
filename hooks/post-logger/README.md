# Response Post-Hook

This hook writes structured log entries after every AI response, creating a comprehensive audit trail for quality assurance, compliance, and performance monitoring.

## Functionality

The response post-hook:
1. Creates structured JSON log entries after each AI interaction
2. Captures essential metadata: timestamp, ticket ID, response reference, confidence score
3. Stores logs in memory for querying and analysis
4. Provides functions to retrieve logs by ticket ID or event type
5. Enables traceability of all AI-generated content in the support pipeline

## Logged Events

The hook logs various types of events throughout the ticket processing lifecycle:

### AI Response Events
- `ai_response_generated`: After any AI-generated response (draft or final)
  - Includes: response reference, confidence score, response type, length

### Processing Pipeline Events
- `pii_redaction`: After PII detection and redaction
  - Includes: types and count of PII instances found
- `triage_completed`: After ticket classification
  - Includes: urgency level, topic category, classification confidence
- `research_completed`: After documentation search and response generation
  - Includes: confidence score, sources found, draft response length
- `ticket_escalated`: When ticket is escalated to human support
  - Includes: escalation reason, priority level, context summary
- `response_finalized`: When final response is determined
  - Includes: whether response was auto-resolved or requires human review
- `pipeline_error`: When errors occur in processing pipeline
  - Includes: error message and stack trace (in development)

## Log Entry Structure

Each log entry contains:
```javascript
{
  "ticket_id": "uuid-string",
  "event": "ai_response_generated",
  "data": {
    "response_type": "draft|final",
    "response_reference": "Actual response text or reference ID",
    "confidence_score": 0.85,
    "response_length": 342,
    "has_response": true
  },
  "timestamp": "2026-05-24T10:30:00.000Z"
}
```

## Querying Logs

The hook provides several functions for retrieving logs:

### Get Logs for Specific Ticket
```javascript
const { getLogsByTicketId } = require('./hooks/post-logger');

const ticketLogs = getLogsByTicketId("ticket-uuid-here");
// Returns all log entries for the specified ticket, sorted by timestamp
```

### Get All Logs with Filtering
```javascript
const { getAllLogs } = require('./hooks/post-logger');

// Get recent AI response logs
const aiLogs = getAllLogs({
  event: "ai_response_generated",
  limit: 50
});

// Get logs for specific ticket with pagination
const ticketLogs = getAllLogs({
  ticket_id: "ticket-uuid-here",
  offset: 0,
  limit: 20
});
```

### Clear Logs (Testing)
```javascript
const { clearAllLogs } = require('./hooks/post-logger');
const cleared = clearAllLogs();
// Returns number of log entries cleared
```

## Usage in Processing Pipeline

The hook is automatically invoked after:
1. Researcher subagent generates draft response
2. System determines final response (auto or human-reviewed)
3. Any AI-assisted decision making

Example integration:
```javascript
const { postLoggerHook } = require('./hooks/post-logger');
// ... after generating AI response ...
await postLoggerHook({
  ticket_id: ticket.id,
  response_reference: generatedResponse,
  confidence_score: researchResult.confidence,
  response_type: "draft"
});
```

## Benefits

### Quality Assurance
- Track confidence scores over time to identify degradation
- Audit which types of tickets receive low-confidence responses
- Measure improvement after knowledge base updates

### Compliance
- Complete audit trail of all AI-generated content
- Demonstrate that PII never reaches AI models (via pre-hook logs)
- Retain records for regulatory requirements

### Performance Monitoring
- Measure response generation frequency
- Identify processing bottlenecks
- Correlate confidence scores with ticket attributes

### Continuous Improvement
- Identify common failure patterns in AI responses
- Update knowledge base based on unanswered questions
- Train models on corrected responses from human agents

## Data Retention

In this implementation, logs are stored in memory and cleared when the application restarts.
In a production deployment, this would be replaced with:
- Persistent storage (database, logging service)
- Log rotation and retention policies
- Integration with SIEM or log analysis tools
- Encryption for sensitive log data