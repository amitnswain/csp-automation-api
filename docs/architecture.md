# System Architecture

## Overview

The Customer Support Assistant follows a modular, pipeline-based architecture that separates concerns while enabling seamless data flow between components.

## Component Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌────────────────────┐
│   REST API      │    │   MCP Server     │    │   Web Interface    │
│ (JSON/HTTP)     │    │ (Streamable HTTP)│    │   (Optional)       │
┌─────┬───────────┘    └───────┬──────────┘    └─────────┬──────────┘
      │                          │                         │
      ▼                          ▼                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Automation Pipeline Coordinator                  │
│                       (src/routes/tickets.js)                       │
┌─────────────────┬──────────────────┬────────────────────┬──────────┐
│                 │                  │                    │          │
│   PII Pre-Hook  │   Triage Skill   │ Researcher Subagent │  etc.    │
│ (hooks/pre-pii) │ (skills/triage)  │ (subagents/research)│          │
│                 │                  │                    │          │
└─────────────────┴──────────────────┴────────────────────┴──────────┘
      │                  │                    │          │
      ▼                  ▼                    ▼          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Decision & Resolution Engine                    │
│              (Escalation Check + Response Finalization)             │
┌─────────────────┬──────────────────┬────────────────────┬──────────┐
│                 │                  │                    │          │
│ Escalation Subagent │ Response Logic   │  Plugin System    │  Logging │
│ (subagents/escalate)│                  │ (plugins/tickets) │ (hooks/post-logger) │
│                 │                  │                    │          │
└─────────────────┴──────────────────┴────────────────────┴──────────┘
      │                  │                    │          │
      ▼                  ▼                    ▼          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Storage & Persistence Layer                  │
│              (In-memory Store - Replace with DB in Production)      │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Ticket Ingestion
- REST API endpoint: `POST /tickets`
- MCP tool: `create_ticket`
- Both routes to `src/routes/tickets.js` handler

### 2. PII Pre-Processing
- Automatic invocation of `hooks/pre-pii/index.js`
- Scans description for PII patterns
- Redacts sensitive information with placeholders
- Sets `pii_redacted: true` flag
- Logs redaction event

### 3. Triage Phase
- Invokes `skills/triage/index.js`
- Analyzes title and description for urgency keywords
- Classifies topic using topic keyword matching
- Returns machine-readable classification
- Updates ticket with urgency_level and topic_category

### 4. Research Phase
- Invokes `subagents/researcher/index.js`
- Searches mock documentation based on ticket content
- Generates draft response using topic-specific templates
- Calculates confidence score (0-1)
- Updates ticket with draft_response and researcher_confidence
- Logs research completion and triggers response post-hook

### 5. Escalation Decision
- Invokes `subagents/escalation/index.js`
- Evaluates confidence score, urgency level, and topic
- Determines if human intervention required
- If yes: formats escalation context and updates status to "escalated"
- If no: proceeds to response finalization

### 6. Response Finalization
- If confidence ≥ 0.7: uses draft as final response, sets status to "resolved"
- If confidence < 0.7: prepares placeholder response, sets status to "in_progress"
- Updates ticket with final_response
- Logs response finalization

### 7. Audit Logging
- Invokes `hooks/post-logger/index.js` after each AI interaction
- Creates structured log entries with:
  - Timestamp
  - Ticket ID
  - Event type (pii_redaction, triage_completed, research_completed, etc.)
  - Event-specific data
- Stores logs in memory (replace with persistent storage in production)

### 8. Resolution
- Ticket remains in system for tracking and follow-up
- Human agents can access original tickets (with PII) for escalated cases
- AI-generated responses available in logs for quality assurance
- System provides intent mappings and recommended actions for optimization

## Integration Points

### MCP Server
All pipeline components exposed as MCP tools:
- Ticket operations: create, list, get, update status
- Automation: triage, research, escalate
- Plugin: get intent mappings
- PII: detect PII
- Logging: get logs, clear logs
- System: get status

### REST API
Enhanced endpoints mirror MCP functionality with standard JSON interface:
- Standard CRUD operations with filtering
- Specialized endpoints for automation triggers
- Plugin and logging endpoints
- System monitoring

### Plugin System
The tickets plugin provides:
- Intent mappings based on urgency, topic, confidence
- Recommended actions and next steps
- Effort estimation and role suggestions
- Used by both AI components and human agents for decision making

## Security Boundaries

### PII Protection Boundary
```
[Raw Ticket] --> [PII Pre-Hook] --> [Redacted Ticket] --> [AI Processing]
                    │                       │
                    └──(Original Preserved)──┘
                    (For Authorized Human Access Only)
```

### AI Processing Boundary
All AI components (triage, research, escalation) receive only:
- Redacted ticket information
- No access to original PII
- Audit trail logs what was processed
```

## Scalability Considerations

### Horizontal Scaling
- API servers can be scaled behind load balancer
- MCP server supports multiple concurrent connections
- Stateless design enables easy replication

### Bottlenecks & Solutions
1. **Knowledge Base Search** → Add caching layer (Redis)
2. **Logging I/O** → Use async logging or message queue
3. **Ticket Storage** → Replace in-memory with database
4. **Pipeline Processing** → Implement message queue (RabbitMQ/Kafka)

### Database Migration Path
When migrating from in-memory to persistent storage:
1. Replace `src/store/ticketStore.js` with database-backed implementation
2. Update `src/hooks/post-logger/index.js` for persistent logs
3. Maintain same interface definitions for backward compatibility
4. Add migration scripts for existing data
```

## Technology Stack

### Core Runtime
- Node.js 18+
- Express.js 5.x

### AI/ML Simulation
- Rule-based classification (triage)
- Template-based generation (researcher)
- Decision trees (escalation)
- No external AI API calls (fully self-contained)

### Integration
- Model Context Protocol (MCP) SDK for tool exposure
- Zod for schema validation
- Jest for testing

### Development
- ESLint for code quality
- Prettier for formatting
- Standard JS conventions

## Production Readiness Indicators

✅ **Security**: PII never reaches AI components  
✅ **Compliance**: Complete audit trail of AI interactions  
✅ **Observability**: Structured logging and monitoring hooks  
✅ **Scalability**: Stateless components, horizontal scaling potential  
✅ **Maintainability**: Modular design, clear interfaces, comprehensive docs  
✅ **Testability**: Unit and integration test coverage  
✅ **Documentation**: API specs, component READMEs, architecture docs  
✅ **Extensibility**: Plugin architecture, configurable patterns, modular design