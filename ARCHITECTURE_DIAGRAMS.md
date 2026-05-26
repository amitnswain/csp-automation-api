# CSP Automation API - Architecture Diagrams

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CSP AUTOMATION API                                 │
│                     (Customer Support Automation)                           │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │   CLIENT LAYER   │
                    └────────┬─────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
    ┌─────────┐         ┌─────────┐        ┌──────────┐
    │  REST   │         │   MCP   │        │  PLUGINS │
    │   API   │         │ SERVER  │        │  SYSTEM  │
    └────┬────┘         └────┬────┘        └─────┬────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                    ┌────────▼────────┐
                    │  ROUTING LAYER  │
                    │  (Express.js)   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
         ┌─────────┐   ┌──────────┐   ┌──────────┐
         │ HOOKS   │   │ PIPELINE │   │   ROUTES │
         │ LAYER   │   │ EXECUTOR │   │ HANDLERS │
         └────┬────┘   └─────┬────┘   └────┬─────┘
              │              │             │
              └──────────────┼─────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
    ┌─────────┐         ┌──────────┐      ┌──────────┐
    │ SKILLS  │         │ SUBAGENTS│      │  HOOKS   │
    │ LAYER   │         │ LAYER    │      │ LAYER    │
    └────┬────┘         └────┬─────┘      └────┬─────┘
         │                   │                 │
         │                   │                 │
         ▼                   ▼                 ▼
    ┌─────────┐       ┌────────────┐     ┌──────────┐
    │ TRIAGE  │       │ RESEARCHER │     │   PII    │
    │ SKILL   │       │ SUBAGENT   │     │  PRE     │
    └────┬────┘       └────┬───────┘     │  HOOK    │
         │                 │             └────┬─────┘
         │                 │                  │
         └─────────────────┼──────────────────┘
                           │
                    ┌──────▼──────┐
                    │ STORE LAYER │
                    │  (Memory)   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   TICKET    │
                    │    STORE    │
                    └─────────────┘
```

---

## Detailed Component Interaction

```
CREATE TICKET REQUEST
│
├─> Express Router (POST /tickets)
│
├─> Validation Layer
│   ├─> validateCreateTicketBody()
│   └─> Return 400 if invalid
│
├─> Store: createTicket()
│   └─> Return ticket with ID
│
├─> Fire-and-Forget Pipeline
│   │
│   ├─> STAGE 1: PII Pre-Hook
│   │   ├─> prePiiHook(ticket)
│   │   ├─> detectPii(description)
│   │   ├─> redactPii(text)
│   │   └─> updateTicketFields(pii_redacted: true)
│   │
│   ├─> STAGE 2: Ticket Triage
│   │   ├─> triageTicket(ticketData)
│   │   ├─> classifyUrgency()
│   │   ├─> classifyTopic()
│   │   └─> updateTicketFields(urgency, category, triage_result)
│   │
│   ├─> STAGE 3: Researcher Subagent
│   │   ├─> researchTicket(ticketData)
│   │   ├─> searchDocumentation()
│   │   ├─> generateDraftResponse()
│   │   └─> updateTicketFields(draft_response, confidence_score)
│   │
│   ├─> STAGE 4: Escalation Logic
│   │   ├─> shouldEscalateIfNeeded(context)
│   │   ├─> Check confidence < 0.4? → Escalate
│   │   ├─> Check urgency = critical? → Escalate
│   │   ├─> Check category = security/access? → Escalate
│   │   ├─> Check confidence < 0.6 AND urgency = high? → Escalate
│   │   │
│   │   ├─ IF Escalate:
│   │   │  ├─> escalateTicket(escalationData)
│   │   │  ├─> updateTicketFields(status: escalated, escalation_reason)
│   │   │  └─> Return
│   │   │
│   │   └─ IF NOT Escalate:
│   │      └─> Continue to Stage 5
│   │
│   ├─> STAGE 5: Auto-Resolution Check
│   │   ├─> confidence_score >= 0.7?
│   │   ├─ IF YES:
│   │   │  ├─> status = "closed"
│   │   │  └─> final_response = draft_response
│   │   └─ IF NO:
│   │      ├─> status = "in_progress"
│   │      └─> final_response = "Requires human review"
│   │
│   └─> STAGE 6: Post-Hook Logging
│       ├─> postLoggerHook(logData)
│       ├─> addLogEntry(event: ai_response_generated)
│       ├─> Log confidence, response_type, response_length
│       └─> Return
│
└─> Return 201 Created (immediate)
   └─> Pipeline continues processing in background
```

---

## Data Flow Diagram

```
CLIENT REQUEST
│
├─ POST /tickets
│  └─ {subject, description, submitter_ref}
│
▼
TICKET CREATION STORE
│
├─ Generate UUID: ticket_id
├─ Set status: "open"
├─ Set timestamps: created_at, updated_at
├─ Initialize fields: urgency=null, category=null, etc.
└─ Store ticket
│
▼
TICKET PIPELINE (async)
│
├─ INPUT: ticket_id
│
├─> PII DETECTION
│   ├─ READ: ticket.description
│   ├─ DETECT: PII patterns
│   ├─ REDACT: sensitive data
│   └─ WRITE: ticket.description (redacted)
│        ticket.pii_redacted = true
│
├─> TRIAGE CLASSIFICATION
│   ├─ READ: ticket.subject, ticket.description
│   ├─ ANALYZE: keyword matching
│   ├─ COMPUTE: urgency score, category score
│   └─ WRITE: ticket.urgency
│        ticket.category
│        ticket.triage_result
│
├─> RESEARCH & RESPONSE
│   ├─ READ: ticket.subject, ticket.description, ticket.category
│   ├─ SEARCH: 12 documentation sources
│   ├─ SCORE: relevance of each document
│   ├─ GENERATE: draft response from top doc
│   ├─ COMPUTE: confidence score
│   └─ WRITE: ticket.draft_response
│        ticket.confidence_score
│
├─> ESCALATION DECISION
│   ├─ READ: ticket.confidence_score, ticket.urgency, ticket.category
│   ├─ EVALUATE: 4 escalation rules
│   │
│   ├─ IF ESCALATE:
│   │  ├─ WRITE: ticket.status = "escalated"
│   │  ├─ WRITE: ticket.escalation_reason
│   │  ├─ LOG: ticket_escalated event
│   │  └─ EXIT PIPELINE
│   │
│   └─ IF NOT ESCALATE:
│      └─ CONTINUE
│
├─> AUTO-RESOLUTION
│   ├─ READ: ticket.confidence_score
│   │
│   ├─ IF confidence >= 0.7:
│   │  ├─ WRITE: ticket.status = "closed"
│   │  ├─ WRITE: ticket.final_response = draft_response
│   │  └─ LOG: response_finalized
│   │
│   └─ IF confidence < 0.7:
│      ├─ WRITE: ticket.status = "in_progress"
│      ├─ WRITE: ticket.final_response = review message
│      └─ LOG: response_finalized
│
├─> EVENT LOGGING
│   ├─ LOG: pii_redaction event
│   ├─ LOG: triage_completed event
│   ├─ LOG: research_completed event
│   ├─ LOG: escalation or response_finalized event
│   └─ STORE: all logs linked to ticket_id
│
└─ PIPELINE COMPLETE
   └─ Ticket ready for:
      ├─ Return to client (GET /tickets/{id})
      ├─ Agent review (if escalated)
      ├─ Customer notification (if closed)
      └─ Follow-up (if in_progress)
```

---

## Component Dependency Graph

```
                       ┌──────────────────┐
                       │   Express.js     │
                       │    (Routing)     │
                       └────────┬─────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
          ┌──────────┐   ┌────────────┐   ┌──────────┐
          │ Triage   │   │ Researcher │   │Escalation│
          │ Skill    │   │ Subagent   │   │Subagent  │
          └────┬─────┘   └──────┬─────┘   └─────┬────┘
               │                │              │
               └────────────────┼──────────────┘
                                │
                 ┌──────────────┴──────────────┐
                 │                             │
                 ▼                             ▼
          ┌─────────────────┐         ┌─────────────────┐
          │ PII Pre-Hook    │         │ Post-Logger Hook│
          │ (Input Filter)  │         │ (Event Logger)  │
          └────────┬────────┘         └────────┬────────┘
                   │                           │
                   └──────────────┬────────────┘
                                  │
                          ┌───────▼───────┐
                          │ Ticket Store  │
                          │ (Data Layer)  │
                          └───────────────┘
```

---

## State Transitions

```
TICKET LIFECYCLE

                  Created
                    │
                    ▼
          ┌──────────────────┐
          │  OPEN (initial)  │
          └────────┬─────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
  ┌──────────┐        ┌──────────────┐
  │IN_PROGRESS│       │ESCALATED     │
  │(for review)       │(to human)    │
  └────┬─────┘        └──────┬───────┘
       │                     │
       │           ┌─────────┴─────────┐
       │           │                   │
       ▼           ▼                   ▼
   ┌────────┐  ┌────────┐         ┌──────────┐
   │CLOSED  │  │RESOLVED│         │REOPENED  │
   │(done)  │  │(final) │         │(if wrong)│
   └────────┘  └────────┘         └────┬─────┘
                                       │
                                       ▼
                                  ┌────────┐
                                  │IN_PROG. │
                                  └────────┘
```

---

## API Endpoint Call Flow

```
┌─ Create Ticket (POST /tickets)
│  ├─ Input: {subject, description, submitter_ref}
│  ├─ Process: Create + Fire pipeline
│  └─ Output: 201 {ticket}
│
├─ List Tickets (GET /tickets?status=...&urgency=...)
│  ├─ Input: Query filters
│  ├─ Process: Filter from store
│  └─ Output: 200 [{ticket}, ...]
│
├─ Get Ticket (GET /tickets/{id})
│  ├─ Input: Ticket ID
│  ├─ Process: Lookup in store
│  └─ Output: 200 {ticket} or 404
│
├─ Update Status (PATCH /tickets/{id}/status)
│  ├─ Input: {status}
│  ├─ Process: Validate transition, update
│  └─ Output: 200 {ticket} or 400
│
├─ Update Urgency (PATCH /tickets/{id}/urgency)
│  ├─ Input: {urgency}
│  ├─ Process: Validate level, update
│  └─ Output: 200 {ticket} or 400
│
├─ Update Category (PATCH /tickets/{id}/category)
│  ├─ Input: {category}
│  ├─ Process: Validate category, update
│  └─ Output: 200 {ticket} or 400
│
└─ Update Confidence (PATCH /tickets/{id}/confidence-score)
   ├─ Input: {confidence_score}
   ├─ Process: Validate range (0-1), update
   └─ Output: 200 {ticket} or 400
```

---

## MCP Tool Exposure

```
MCP SERVER (localhost:3000/mcp)
│
├─ Tool 1: create_ticket
│  ├─ Input: {subject, description, submitter_ref}
│  └─ Returns: {success, data: {ticket}}
│
├─ Tool 2: list_tickets
│  ├─ Input: {status?, urgency?, category?, search?}
│  └─ Returns: {success, data: {tickets}}
│
├─ Tool 3: get_ticket
│  ├─ Input: {ticket_id}
│  └─ Returns: {success, data: {ticket}}
│
├─ Tool 4: update_ticket_status
│  ├─ Input: {ticket_id, status}
│  └─ Returns: {success, data: {ticket}}
│
├─ Tool 5: update_ticket_urgency
│  ├─ Input: {ticket_id, urgency}
│  └─ Returns: {success, data: {ticket}}
│
├─ Tool 6: update_ticket_category
│  ├─ Input: {ticket_id, category}
│  └─ Returns: {success, data: {ticket}}
│
└─ Tool 7: update_ticket_confidence_score
   ├─ Input: {ticket_id, confidence_score}
   └─ Returns: {success, data: {ticket}}
```

---

## Processing Timeline Example

```
T+0ms   → Ticket Created
         └─ ticket_id assigned
         └─ status = "open"
         └─ response: 201 Created (immediate)
         └─ Pipeline starts (background)

T+5ms   → Stage 1: PII Pre-Hook
         └─ Scan description for PII
         └─ Redact sensitive information
         └─ Update store

T+10ms  → Stage 2: Triage Skill
         └─ Classify urgency and category
         └─ Update store with classifications

T+15ms  → Stage 3: Researcher Subagent
         └─ Search documentation
         └─ Generate draft response
         └─ Calculate confidence

T+20ms  → Stage 4: Escalation Decision
         └─ Evaluate escalation rules
         └─ Update status (escalated or continue)

T+25ms  → Stage 5: Auto-Resolution (if not escalated)
         └─ Check confidence threshold
         └─ Set final status (closed or in_progress)

T+30ms  → Stage 6: Post-Hook Logging
         └─ Log all processing events
         └─ Create audit trail

T+35ms  → Pipeline Complete
         └─ All processing done
         └─ Ticket ready for use

CLIENT  → Can immediately GET ticket (after stage processing)
         └─ Will see partially processed data
         └─ Full data available after all stages (T+35ms)
```

---

## Error Handling Flow

```
REQUEST
│
▼
VALIDATION
├─ Required fields present?
├─ Data types correct?
├─ Values valid?
│
├─ NO? → VALIDATION ERROR
│        └─ Response: 400 Bad Request
│           └─ Details: {field: "error message"}
│
└─ YES? → Continue

PROCESSING
│
├─ Resource exists?
├─ Operation allowed?
│
├─ NO? → BUSINESS ERROR
│        └─ Response: 409/422
│           └─ Details: Specific error
│
└─ YES? → Continue

EXECUTION
│
├─ No exceptions?
│
├─ NO? → SYSTEM ERROR
│        └─ Response: 500 Internal Server Error
│           └─ Log: Full stack trace
│
└─ YES? → Success
         └─ Response: 200/201
            └─ Data: Processed result
```

---

All diagrams represent the actual implementation in the CSP Automation API.
