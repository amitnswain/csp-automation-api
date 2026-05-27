# Customer Support Assistant

A fully automated, end-to-end customer support assistant using Claude AI that handles incoming support tickets from receipt through resolution or human escalation. The system integrates a REST API, intelligent subagents, an MCP server, processing hooks, and a natural language plugin to address the four key challenges of customer support at scale:

1. **High ticket volume with inconsistent manual triage** → AI-powered triage skill
2. **Agents spending excessive time searching documentation** → Researcher subagent
3. **Sensitive PII in ticket text posing compliance risks** → PII pre-hook
4. **No audit trail for AI-generated responses** → Response post-hook

## System Overview

![System Architecture](docs/architecture.png)

The platform processes tickets through an automated pipeline:
1. **Ticket Arrival** → REST API or MCP tool
2. **PII Pre-Hook** → Detect and redact sensitive information
3. **Triage Skill** → Classify by urgency and topic
4. **Researcher Subagent** → Search knowledge base and generate draft response
5. **Escalation Check** → Determine if human intervention needed
6. **Response Finalization** → Auto-resolve or route to human review
7. **Response Post-Hook** → Log AI response with full metadata
8. **Resolution** → Ticket closed or escalated to human queue

## Features

### Core Components
- **REST API** - Standard CRUD operations for tickets with automation triggers
- **MCP Server** - Exposes all functionality as Claude Code tools via HTTP transport
- **Ticket Triage Skill** (/skills/triage/) - Classifies tickets by urgency (low/medium/high/critical) and topic (billing/technical/feature_request/security/etc.)
- **Researcher Subagent** (/subagents/researcher/) - Searches mock documentation and generates draft responses with confidence scores
- **Escalation Subagent** (/subagents/escalation/) - Detects unresolvable tickets and formats them for human escalation
- **PII Pre-Hook** (/hooks/pre-pii/) - Detects and redacts PII (names, emails, phones, addresses, accounts, payments) before AI processing
- **Response Post-Hook** (/hooks/post-logger/) - Writes structured audit logs after every AI response
- **Tickets Plugin** (/plugins/tickets/) - Provides intent mappings and recommended actions based on ticket characteristics

### Automation Pipeline
When a ticket is created, the system automatically:
1. Scans for and redacts PII
2. Classifies urgency and topic using keyword-based analysis
3. Searches knowledge base for relevant documentation
4. Generates a draft response with confidence score (0-1)
5. Determines if escalation is needed based on confidence, urgency, and topic
6. Finalizes response (auto-resolve if confidence ≥ 0.7, otherwise flags for human review)
7. Logs all AI interactions with timestamp, ticket ID, response reference, and confidence score

## API Endpoints

### Ticket Management
- `POST /tickets` - Create a new ticket (triggers automation pipeline)
- `GET /tickets` - List tickets with filtering (status, urgency, topic, search)
- `GET /tickets/:id` - Get specific ticket
- `PATCH /tickets/:id` - Update ticket fields (status, urgency, topic, confidence)

### Automation Tools
- `POST /tickets/:id/triage` - Manually trigger ticket triage
- `POST /tickets/:id/research` - Manually trigger research subagent
- `POST /tickets/:id/escalate` - Manually escalate to human support
- `GET /tickets/:id/intents` - Get intent mappings and recommended actions
- `POST /tickets/:id/pii` - Detect PII in ticket description

### Logging & Audit
- `GET /tickets/:id/logs` - Get processing logs for a ticket
- `POST /logs/clear` - Clear all processing logs (testing)

### System
- `GET /system/status` - Get system status and statistics

### MCP Server
- All above functionality available as MCP tools at `http://localhost:3000/mcp`
- Streamable HTTP transport
- No authentication (development only)

## Data Model

Enhanced ticket model includes:
- Standard fields: `id`, `title`, `description`, `requester`, `status`, `createdAt`, `updatedAt`
- Automation fields: 
  - `urgency_level` (low, medium, high, critical)
  - `topic_category` (billing, technical, feature_request, security, access_request, hardware, software, network, other)
  - `triage_result` (JSON classification)
  - `pii_redacted` (boolean)
  - `researcher_confidence` (0-1)
  - `escalation_reason` (string)
  - `ai_processing_log` (array of log entries)
  - `draft_response` (AI-generated draft)
  - `final_response` (human-approved or AI-final response)

## Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
npm install
```

### Running the System
```bash
# Start the server (REST API + MCP server)
npm start

# Server will be available at:
# - REST API: http://localhost:3000
# - MCP Server: http://localhost:3000/mcp
```
# Terminal 2: Create a Ticket
curl -X POST http://localhost:3000/tickets -H "Content-Type: application/json" -d "{\"subject\":\"Test\",\"description\":\"Testing\",\"submitter_ref\":\"user\"}"

# Terminal 2: Check Results (after 2 seconds)
curl -X GET http://localhost:3000/tickets

# Terminal 3: Check Results (after 2 seconds)
curl -X GET http://localhost:3000/tickets/68a2c2cd-c5fc-4eef-bb07-cd3269920612

# Terminal 4: Check Results (after 2 seconds)
curl -X PATCH http://localhost:3000/tickets/28d18aa2-c403-47dc-82d6-3b82f2f680ec -H "Content-Type: application/json" -d "{\"subject\":\"Updated subject of VPN disconnection\"}"

# Terminal 5: Check Results (after 2 seconds)
curl -X DELETE http://localhost:3000/tickets/68a2c2cd-c5fc-4eef-bb07-cd3269920612


### Running Tests
```bash
npm test
```

## Configuration

The system uses environment variables for configuration:
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

## API Documentation

- OpenAPI Specification: [openapi.yaml](openapi.yaml)
- Interactive API docs available at startup (console output)
- MCP Tool Documentation: See individual component READMEs

## Component Documentation

- [Ticket Triage Skill](skills/triage/README.md)
- [Researcher Subagent](subagents/researcher/README.md)
- [Escalation Subagent](subagents/escalation/README.md)
- [PII Pre-Hook](hooks/pre-pii/README.md)
- [Response Post-Hook](hooks/post-logger/README.md)
- [Tickets Plugin](plugins/tickets/README.md)
- [MCP Server Usage](MCP.md)

## Architecture

### Processing Flow
```
Ticket Arrival
        ↓
    PII Pre-Hook  ←───┐
        ↓             │
    Triage Skill      │
        ↓             │
 Researcher Subagent  │
        ↓             │
   Escalation Check ──┘
        ↓
   [Auto-resolve if confidence ≥ 0.7]
        ↓
   [Flag for human review if confidence < 0.7]
        ↓
Response Post-Hook (logging)
        ↓
   Ticket Resolution/Escalation
```

### Security & Compliance
- **PII Protection**: PII detected and redacted before any AI processing
- **Audit Trail**: Complete logging of all AI interactions
- **Data Minimization**: Only necessary data shared with AI components
- **Access Control**: Original PII preserved in system for authorized human agents

## Testing

### Test Suite
- Unit tests for all core components
- Integration tests covering full ticket lifecycle
- MCP server integration tests
- PII detection and redaction validation
- Automation pipeline end-to-end tests

Run tests with:
```bash
npm test
```

### Test Coverage
- Ticket creation → triage → research → response → logging
- Escalation path for low-confidence/unresolvable tickets
- PII detection and redaction verification
- MCP tool exposure and functionality
- Intent mapping and recommendation accuracy

## Extensibility

### Adding New Documentation
Modify `subagents/researcher/mock-documentation.js` to add new knowledge base entries.

### Customizing PII Patterns
Update `hooks/pre-pii/index.js` to modify regex patterns for different data formats or jurisdictions.

### Adjusting Escalation Criteria
Modify `subagents/escalation/index.js` to change escalation thresholds or add new criteria.

### Enhancing Intent Mappings
Update `plugins/tickets/index.js` to add new intent categories or modify existing ones.

### Changing Confidence Thresholds
Adjust the confidence thresholds in the automation pipeline (`src/routes/tickets.js`) and intent mappings.

## Deployment Notes

### Production Considerations
1. Replace in-memory ticket store with persistent database (PostgreSQL, MongoDB, etc.)
2. Replace in-memory logging with persistent storage (ELK stack, cloud logging, etc.)
3. Add authentication and authorization to MCP server and REST API
4. Implement rate limiting and DDoS protection
5. Add monitoring and alerting (Prometheus, Grafana, etc.)
6. Configure proper logging rotation and retention policies
7. Add backup and disaster recovery procedures

### Scaling Options
1. Horizontal scaling of API servers behind load balancer
2. Message queue (RabbitMQ, Apache Kafka) for pipeline processing
3. Microservices architecture for independent component scaling
4. Caching layer (Redis) for frequent knowledge base lookups
5. Database read replicas for reporting queries

## License

ISC License

## Acknowledgments

Built as a demonstration of mastery in:
- REST API design and implementation
- MCP server integration and tool exposure
- AI agent orchestration (subagents)
- Processing hooks (pre/post-processing)
- Plugin architectures and intent mapping
- Comprehensive testing strategies
- Security and compliance considerations
- Documentation and API specification