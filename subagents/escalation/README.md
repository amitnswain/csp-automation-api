# Escalation Subagent

This subagent detects when tickets require human intervention and formats them for escalation to human support agents.

## Functionality

The escalation subagent:
1. Analyzes ticket context including triage results, researcher confidence, and processing history
2. Determines if a ticket should be escalated to human support based on predefined rules
3. Formats escalated tickets with full context for human agents
4. Assigns appropriate priority levels to escalated tickets

## Escalation Criteria

Tickets are escalated when:

### Low Confidence (< 0.4)
- When the researcher subagent has low confidence in its generated response
- Indicates insufficient information in knowledge base to provide reliable answer

### Critical Urgency
- All tickets triaged as "critical" urgency (system outages, security breaches, blocking issues)
- Requires immediate human judgment and intervention

### High-Risk Categories
- Security-related incidents (vulnerabilities, breaches, suspicious activity)
- Access request permissions (privilege elevation, sensitive data access)

### Combined Factors
- High urgency tickets with moderate confidence (< 0.6)
- Indicates potentially serious issue that researcher couldn't fully resolve

## Escalation Format

When a ticket is escalated, the system provides:
- Original ticket information
- Complete triage results (urgency, topic, classification details)
- Researcher findings (confidence, sources consulted, draft response)
- Full processing log (all AI interactions and decisions)
- Recommended priority level for human agent
- Empty notes field for human agent to document their investigation

## Priority Levels

Escalated tickets inherit priority from triage with adjustments:
- **critical**: System-wide issues, security breaches
- **high**: Urgent business-impacting issues
- **medium**: Standard escalations
- **low**: Low-priority issues requiring human review

Security issues automatically boost priority by one level.

## Usage

```javascript
const { shouldEscalateIfNeeded, escalateTicket } = require('./subagents/escalation');

// Check if escalation is needed
const context = {
  confidence: 0.35, // Low confidence from researcher
  triageResult: { urgency_level: "high", topic_category: "technical" },
  ticketId: "ticket-123"
};

if (shouldEscalateIfNeeded(context)) {
  const escalationData = {
    ticketId: "ticket-123",
    reason: "Low confidence score (0.35) indicates unreliable automated response",
    context: {
      ticketInfo: { title: "Application Crash", description: "...", requester: "user" },
      triageResult: { urgency_level: "high", topic_category: "technical" },
      researchResult: { confidence: 0.35, draft_response: "Limited information available..." },
      processingLog: [/* ... */]
    }
  };

  const escalationResult = escalateTicket(escalationData);
  // Send escalationResult to human queue/ticketing system
}
```