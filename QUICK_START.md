# Quick Start Guide - CSP Automation API

## Table of Contents
1. [Component Status](#component-status)
2. [Prerequisites](#prerequisites)
3. [Running the Application](#running-the-application)
4. [Testing the APIs](#testing-the-apis)
5. [System Architecture](#system-architecture)
6. [Testing Commands](#testing-commands)

---

## Component Status

All components are **properly implemented and corrected**:

| Component | Status | Description |
|-----------|--------|-------------|
| **Ticket Triage Skill** | ✅ Implemented | Classifies tickets by urgency (critical/high/medium/low) and topic (technical/billing/security/hardware/network/software/access_request/feature_request) |
| **Researcher Subagent** | ✅ Implemented | Searches mock documentation and generates draft responses with confidence scores |
| **Escalation Subagent** | ✅ Implemented | Determines if tickets need human escalation based on confidence and urgency |
| **PII Pre-Hook** | ✅ Implemented | Detects and redacts PII (names, emails, phone numbers, addresses, account numbers, payment info, etc.) |
| **Response Post-Hook** | ✅ Implemented | Logs all AI responses and processing events for audit and quality assurance |
| **Tickets Plugin** | ✅ Implemented | Provides intent mappings and recommended actions based on ticket characteristics |
| **MCP Server** | ✅ Implemented | Exposes all ticket functionality as MCP tools over HTTP transport |
| **REST API** | ✅ Implemented | Full REST API for ticket management |

---

## Prerequisites

### System Requirements
- Node.js v24.15.0 or higher
- npm (comes with Node.js)
- Windows PowerShell or CMD
- Port 3000 available on localhost

### Installation

1. **Clone/Open the project**
   ```powershell
   cd c:\Users\Administrator\Desktop\Claude_Projects\csp-automation-api
   ```

2. **Install dependencies**
   ```powershell
   npm install
   ```

   This installs:
   - `@modelcontextprotocol/sdk` - MCP protocol support
   - `express` - REST API framework
   - `zod` - Validation library
   - `jest` & `supertest` - Testing tools

---

## Running the Application

### Start the Server

Open PowerShell and run:

```powershell
cd c:\Users\Administrator\Desktop\Claude_Projects\csp-automation-api
node src/server.js
```

**Expected Output:**
```
IT Support Ticket API is running on port 3000
```

The server will:
- Start REST API at `http://localhost:3000`
- Start MCP Server at `http://localhost:3000/mcp`
- Load sample tickets into memory storage

### Server Endpoints

| Endpoint | Type | Description |
|----------|------|-------------|
| `/tickets` | POST | Create a new ticket (triggers full automation pipeline) |
| `/tickets` | GET | List all tickets with optional filters |
| `/tickets/:id` | GET | Get a specific ticket |
| `/tickets/:id/status` | PATCH | Update ticket status |
| `/tickets/:id/urgency` | PATCH | Update ticket urgency level |
| `/tickets/:id/category` | PATCH | Update ticket category |
| `/tickets/:id/confidence-score` | PATCH | Update confidence score |
| `/mcp` | POST | MCP Server endpoint (for Claude integration) |

---

## Testing the APIs

### Option 1: Using cURL (Command Line)

#### 1. Create a New Ticket

```powershell
$body = @{
    subject = "Cannot connect to corporate VPN"
    description = "VPN client fails with authentication timeout after password reset. This is blocking my access to production systems."
    submitter_ref = "john.smith"
} | ConvertTo-Json

curl -X POST http://localhost:3000/tickets `
  -H "Content-Type: application/json" `
  -d $body
```

**Expected Response:**
```json
{
  "ticket_id": "uuid-string",
  "subject": "Cannot connect to corporate VPN",
  "description": "VPN client fails with authentication timeout after password reset. This is blocking my access to production systems.",
  "submitter_ref": "john.smith",
  "status": "open",
  "urgency": null,
  "category": null,
  "triage_result": null,
  "confidence_score": null,
  "created_at": "2026-05-25T...",
  "updated_at": "2026-05-25T..."
}
```

**Note:** After ticket creation, the system automatically:
- ✅ Detects and redacts any PII
- ✅ Triages the ticket (assigns urgency & category)
- ✅ Researches documentation
- ✅ Generates confidence score
- ✅ Determines if escalation is needed
- ✅ Logs all events

#### 2. List All Tickets

```powershell
curl http://localhost:3000/tickets
```

#### 3. Get Specific Ticket

```powershell
curl http://localhost:3000/tickets/{ticket_id}
```

#### 4. Update Ticket Status

```powershell
$body = @{ status = "in_progress" } | ConvertTo-Json

curl -X PATCH http://localhost:3000/tickets/{ticket_id}/status `
  -H "Content-Type: application/json" `
  -d $body
```

#### 5. Update Ticket Urgency

```powershell
$body = @{ urgency = "high" } | ConvertTo-Json

curl -X PATCH http://localhost:3000/tickets/{ticket_id}/urgency `
  -H "Content-Type: application/json" `
  -d $body
```

#### 6. Update Ticket Category

```powershell
$body = @{ category = "technical" } | ConvertTo-Json

curl -X PATCH http://localhost:3000/tickets/{ticket_id}/category `
  -H "Content-Type: application/json" `
  -d $body
```

---

### Option 2: Using Postman

1. **Open Postman**
2. **Create a new collection** called "CSP Automation API"
3. **Create requests for each endpoint** (see examples below)

#### Create Ticket Request
- **Method:** POST
- **URL:** `http://localhost:3000/tickets`
- **Body (JSON):**
  ```json
  {
    "subject": "Laptop camera not detected",
    "description": "Camera is missing in Teams and Device Manager after last update.",
    "submitter_ref": "sara.lee"
  }
  ```

#### List Tickets Request
- **Method:** GET
- **URL:** `http://localhost:3000/tickets`
- **Query Parameters:**
  - `status` = `open` (optional)
  - `urgency` = `high` (optional)
  - `category` = `technical` (optional)
  - `search` = `vpn` (optional)

#### Get Specific Ticket Request
- **Method:** GET
- **URL:** `http://localhost:3000/tickets/{{ticket_id}}`

---

### Option 3: Using Node.js Test Script

Create a file named `test-api.js`:

```javascript
const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== CSP Automation API Tests ===\n');

  try {
    // Test 1: Create a ticket
    console.log('1. Creating a new ticket...');
    const createRes = await makeRequest('POST', '/tickets', {
      subject: 'Cannot connect to corporate VPN',
      description: 'VPN client fails with authentication timeout after password reset.',
      submitter_ref: 'alice.ng'
    });
    
    const ticketId = createRes.data.ticket_id;
    console.log(`✓ Ticket created with ID: ${ticketId}`);
    console.log(`  Status: ${createRes.data.status}`);
    console.log(`  Subject: ${createRes.data.subject}\n`);

    // Wait a moment for pipeline processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Get the ticket (to see processed data)
    console.log('2. Retrieving ticket (with pipeline processing)...');
    const getRes = await makeRequest('GET', `/tickets/${ticketId}`);
    console.log(`✓ Ticket retrieved:`);
    console.log(`  Urgency: ${getRes.data.urgency}`);
    console.log(`  Category: ${getRes.data.category}`);
    console.log(`  Confidence Score: ${getRes.data.confidence_score}`);
    console.log(`  Status: ${getRes.data.status}\n`);

    // Test 3: Update ticket urgency
    console.log('3. Updating ticket urgency...');
    const updateRes = await makeRequest('PATCH', `/tickets/${ticketId}/urgency`, {
      urgency: 'critical'
    });
    console.log(`✓ Urgency updated to: ${updateRes.data.urgency}\n`);

    // Test 4: Update ticket status
    console.log('4. Updating ticket status...');
    const statusRes = await makeRequest('PATCH', `/tickets/${ticketId}/status`, {
      status: 'in_progress'
    });
    console.log(`✓ Status updated to: ${statusRes.data.status}\n`);

    // Test 5: List all tickets
    console.log('5. Listing all tickets...');
    const listRes = await makeRequest('GET', '/tickets');
    console.log(`✓ Total tickets: ${listRes.data.length}`);
    listRes.data.slice(0, 3).forEach(t => {
      console.log(`  - ${t.subject} (${t.status})`);
    });
    if (listRes.data.length > 3) {
      console.log(`  ... and ${listRes.data.length - 3} more`);
    }
    console.log('');

    // Test 6: Filter by urgency
    console.log('6. Filtering tickets by urgency...');
    const filterRes = await makeRequest('GET', '/tickets?urgency=critical');
    console.log(`✓ Found ${filterRes.data.length} critical ticket(s)\n`);

    console.log('=== All Tests Completed Successfully ===');
  } catch (error) {
    console.error('✗ Test failed:', error.message);
  }
}

runTests();
```

Run the test:
```powershell
node test-api.js
```

---

### Option 4: Using Jest (Automated Tests)

Run all tests:
```powershell
npm test
```

Run specific test file:
```powershell
npm test -- mcp.test.js
npm test -- tickets.test.js
```

---

## System Architecture

### Automation Pipeline (Automatic on Ticket Creation)

When a ticket is created, it automatically goes through:

```
1. PII Pre-Hook
   ├─ Detects personal information (names, emails, phones, addresses, etc.)
   └─ Redacts sensitive data

2. Ticket Triage Skill
   ├─ Classifies urgency (critical, high, medium, low)
   └─ Classifies category (technical, billing, security, hardware, network, software, access_request, feature_request)

3. Researcher Subagent
   ├─ Searches mock documentation
   ├─ Generates draft response
   └─ Calculates confidence score (0-1)

4. Escalation Subagent
   ├─ Evaluates if human intervention needed
   ├─ Checks confidence score (< 0.4 = escalate)
   ├─ Checks urgency (critical = escalate)
   └─ Checks topic (security, access_request = escalate)

5. Response Post-Hook
   ├─ Logs all processing events
   ├─ Records confidence scores
   └─ Maintains audit trail

6. Result
   ├─ If escalated → status = "escalated"
   ├─ If confident (≥0.7) → status = "closed" with final response
   └─ If uncertain (0.4-0.7) → status = "in_progress" for human review
```

### Component Details

#### PII Pre-Hook (`hooks/pre-pii/index.js`)
Detects and redacts:
- Person names
- Email addresses
- Phone numbers
- Physical addresses
- Account/card numbers
- IP addresses
- Dates of birth

#### Triage Skill (`skills/triage/index.js`)
Uses keyword-based classification for:
- **Urgency:** Critical, High, Medium, Low
- **Categories:** 8 topic areas

#### Researcher Subagent (`subagents/researcher/index.js`)
- Searches 12 mock documentation articles
- Generates contextual responses
- Returns confidence 0.3-0.95

#### Escalation Subagent (`subagents/escalation/index.js`)
Escalation rules:
- Confidence < 0.4 → Escalate
- Urgency = critical → Escalate
- Category in [security, access_request] → Escalate
- Confidence < 0.6 AND Urgency = high → Escalate

#### Response Post-Hook (`hooks/post-logger/index.js`)
Logs:
- All AI responses
- Triage results
- Confidence scores
- Escalation events
- Processing errors

#### Tickets Plugin (`plugins/tickets/index.js`)
Intent mappings for:
- Urgency-based actions
- Topic-based actions
- Confidence-based actions
- Recommended next steps

#### MCP Server (`src/mcp/server.js`)
Exposes 7 tools:
1. `create_ticket` - Create new ticket
2. `list_tickets` - List with filters
3. `get_ticket` - Get specific ticket
4. `update_ticket_status` - Change status
5. `update_ticket_urgency` - Change urgency
6. `update_ticket_category` - Change category
7. `update_ticket_confidence_score` - Change confidence

---

## Testing Commands

### Create Critical Ticket (Will Auto-Escalate)
```powershell
$body = @{
    subject = "PRODUCTION SERVER DOWN - URGENT"
    description = "The main production database server has stopped responding. All users are unable to access the system. This is a critical outage requiring immediate attention."
    submitter_ref = "ops.team"
} | ConvertTo-Json

curl -X POST http://localhost:3000/tickets `
  -H "Content-Type: application/json" `
  -d $body
```

### Create Ticket with PII (Will Be Redacted)
```powershell
$body = @{
    subject = "Cannot access my email"
    description = "Hi, my name is John Smith and my email is john.smith@company.com. My phone is 555-123-4567. I cannot access my email since this morning."
    submitter_ref = "john.smith"
} | ConvertTo-Json

curl -X POST http://localhost:3000/tickets `
  -H "Content-Type: application/json" `
  -d $body
```

### Create Security-Related Ticket (Will Auto-Escalate)
```powershell
$body = @{
    subject = "Suspicious login attempt detected"
    description = "I noticed someone attempted to login to my account from an unknown IP address: 192.168.1.100. This looks like a potential security breach."
    submitter_ref = "sara.lee"
} | ConvertTo-Json

curl -X POST http://localhost:3000/tickets `
  -H "Content-Type: application/json" `
  -d $body
```

### Create Technical Issue (May Auto-Resolve)
```powershell
$body = @{
    subject = "Outlook not syncing"
    description = "My Outlook email is not syncing new messages. I checked my internet connection and it's working fine."
    submitter_ref = "michael.tan"
} | ConvertTo-Json

curl -X POST http://localhost:3000/tickets `
  -H "Content-Type: application/json" `
  -d $body
```

---

## Verification Checklist

After starting the server, verify:

- [ ] Server starts without errors
- [ ] Can create tickets via REST API
- [ ] Tickets are auto-processed through pipeline
- [ ] Can list tickets with filters
- [ ] Can retrieve individual tickets
- [ ] Can update ticket properties
- [ ] MCP endpoint is accessible (`http://localhost:3000/mcp`)
- [ ] PII is detected and redacted
- [ ] Triage classification works
- [ ] Research generates responses
- [ ] Escalation logic works
- [ ] Logs are recorded

All components are now properly implemented and tested!
