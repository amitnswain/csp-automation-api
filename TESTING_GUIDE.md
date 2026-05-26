# Step-by-Step Testing Guide

## Complete Workflow: Running & Testing the Application

---

## PART 1: START THE SERVER

### Step 1: Open PowerShell

Press `Win + X` and select "Windows PowerShell" or open PowerShell directly.

### Step 2: Navigate to Project Directory

```powershell
cd c:\Users\Administrator\Desktop\Claude_Projects\csp-automation-api
```

### Step 3: Start the Server

```powershell
node src/server.js
```

**Expected Output:**
```
IT Support Ticket API is running on port 3000
```

✅ **Server is now running on:**
- REST API: `http://localhost:3000`
- MCP Server: `http://localhost:3000/mcp`

**KEEP THIS TERMINAL OPEN!**

---

## PART 2: TEST THE APIS (In a NEW Terminal)

### Step 4: Open Another PowerShell Window

Press `Win + X` and select "Windows PowerShell" again (keep the first one running).

### Step 5: Navigate to Project Directory

```powershell
cd c:\Users\Administrator\Desktop\Claude_Projects\csp-automation-api
```

---

## TEST SCENARIO 1: Create a Normal Technical Issue

### Command:
```powershell
$body = @{
    subject = "Outlook not syncing inbox"
    description = "New emails are not appearing on desktop Outlook since this morning."
    submitter_ref = "michael.tan"
} | ConvertTo-Json

curl -X POST http://localhost:3000/tickets `
  -H "Content-Type: application/json" `
  -d $body
```

### Expected Output:
```json
{
  "ticket_id": "12345-uuid-6789",
  "subject": "Outlook not syncing inbox",
  "description": "New emails are not appearing on desktop Outlook since this morning.",
  "submitter_ref": "michael.tan",
  "status": "open",
  "urgency": null,
  "category": null,
  "confidence_score": null,
  "created_at": "2026-05-25T...",
  "updated_at": "2026-05-25T..."
}
```

### Save the ticket_id! You'll need it for next steps.

```powershell
$ticketId = "12345-uuid-6789"  # Use the actual ID from response
```

### Step 6: Wait 2 Seconds for Pipeline Processing

```powershell
Start-Sleep -Seconds 2
```

### Step 7: Retrieve the Processed Ticket

```powershell
curl http://localhost:3000/tickets/$ticketId
```

### Expected Output (Now with processed data):
```json
{
  "ticket_id": "12345-uuid-6789",
  "subject": "Outlook not syncing inbox",
  "description": "New emails are not appearing on desktop Outlook since this morning.",
  "submitter_ref": "michael.tan",
  "status": "closed",
  "urgency": "high",
  "category": "software",
  "confidence_score": 0.85,
  "draft_response": "Based on our technical documentation:\n\nTo fix Outlook not syncing...",
  "final_response": "Based on our technical documentation:\n\nTo fix Outlook not syncing...",
  "triage_result": "{\"urgency\":\"high\",\"category\":\"software\",...}",
  "pii_redacted": false,
  "created_at": "2026-05-25T...",
  "updated_at": "2026-05-25T...",
  "ai_processing_log": [
    {"event": "pii_redaction", ...},
    {"event": "triage_completed", ...},
    {"event": "research_completed", ...},
    {"event": "response_finalized", ...}
  ]
}
```

✅ **What happened:**
- ✓ PII scan completed (none found in this case)
- ✓ Triage classified as HIGH urgency, SOFTWARE category
- ✓ Research found relevant documentation
- ✓ Confidence was high (0.85)
- ✓ Ticket auto-closed with final response
- ✓ All events logged

---

## TEST SCENARIO 2: Create a CRITICAL Ticket (Auto-Escalate)

### Command:
```powershell
$body = @{
    subject = "PRODUCTION OUTAGE - WEBSITE DOWN"
    description = "The main production server is completely down. All users unable to access the service. This is a critical emergency requiring immediate attention."
    submitter_ref = "ops.team"
} | ConvertTo-Json

curl -X POST http://localhost:3000/tickets `
  -H "Content-Type: application/json" `
  -d $body
```

### Save the ticket ID:
```powershell
$escalatedTicketId = "new-uuid-from-response"
```

### Wait and Retrieve:
```powershell
Start-Sleep -Seconds 2
curl http://localhost:3000/tickets/$escalatedTicketId
```

### Expected Output:
- **status:** "escalated" (not closed!)
- **urgency:** "critical"
- **confidence_score:** (some value)
- **escalation_reason:** "Low confidence score or complex issue requiring human intervention"

✅ **What happened:**
- ✓ Urgency classified as CRITICAL
- ✓ Automatic escalation triggered
- ✓ Escalation event logged
- ✓ Status set to "escalated"
- ✓ Human review required

---

## TEST SCENARIO 3: Create Ticket with PII (Auto-Redacted)

### Command:
```powershell
$body = @{
    subject = "Cannot access my account"
    description = "My name is John Smith, email: john.smith@company.com, phone: 555-123-4567. I can't login to my account. My account number is 123456789."
    submitter_ref = "john.smith"
} | ConvertTo-Json

curl -X POST http://localhost:3000/tickets `
  -H "Content-Type: application/json" `
  -d $body
```

### Save the ticket ID:
```powershell
$piiTicketId = "new-uuid-from-response"
```

### Wait and Retrieve:
```powershell
Start-Sleep -Seconds 2
curl http://localhost:3000/tickets/$piiTicketId
```

### Expected Output:
- **description:** "My name is [REDACTED_PERSON_NAME], email: [REDACTED_EMAIL], phone: [REDACTED_PHONE]. I can't login to my account. My account number is [REDACTED_ACCOUNT_NUMBER]."
- **pii_redacted:** true
- **ai_processing_log** includes `"event": "pii_redaction"`

✅ **What happened:**
- ✓ PII detected in description
- ✓ Sensitive data redacted
- ✓ Original data preserved but masked
- ✓ Event logged for audit trail

---

## TEST SCENARIO 4: Security Issue (Auto-Escalate)

### Command:
```powershell
$body = @{
    subject = "Suspicious security activity"
    description = "I detected an unauthorized login attempt on my account from an unknown IP address. This looks like a potential breach."
    submitter_ref = "sara.lee"
} | ConvertTo-Json

curl -X POST http://localhost:3000/tickets `
  -H "Content-Type: application/json" `
  -d $body
```

### Retrieve:
```powershell
$securityTicketId = "new-uuid"
Start-Sleep -Seconds 2
curl http://localhost:3000/tickets/$securityTicketId
```

### Expected Output:
- **category:** "security"
- **status:** "escalated"
- **escalation_reason:** Set

✅ **What happened:**
- ✓ Category classified as SECURITY
- ✓ Security category triggers auto-escalation
- ✓ Routed to security team

---

## TEST SCENARIO 5: List All Tickets

### Command:
```powershell
curl http://localhost:3000/tickets
```

### Expected Output:
```json
[
  {
    "ticket_id": "...",
    "subject": "...",
    ...
  },
  {
    "ticket_id": "...",
    "subject": "...",
    ...
  }
  // All created tickets
]
```

✅ **What happened:**
- ✓ All created tickets returned

---

## TEST SCENARIO 6: Filter Tickets by Status

### Command:
```powershell
# Get all open tickets
curl http://localhost:3000/tickets?status=open

# Get all closed tickets
curl http://localhost:3000/tickets?status=closed

# Get all escalated tickets
curl http://localhost:3000/tickets?status=escalated
```

### Expected Output:
- Array of tickets matching the status filter

---

## TEST SCENARIO 7: Filter Tickets by Urgency

### Command:
```powershell
# Get all critical tickets
curl http://localhost:3000/tickets?urgency=critical

# Get all high urgency tickets
curl http://localhost:3000/tickets?urgency=high
```

### Expected Output:
- Array of tickets with matching urgency

---

## TEST SCENARIO 8: Search Tickets

### Command:
```powershell
# Search for tickets containing "outlook"
curl http://localhost:3000/tickets?search=outlook

# Search for tickets containing "vpn"
curl http://localhost:3000/tickets?search=vpn
```

### Expected Output:
- Tickets matching search term

---

## TEST SCENARIO 9: Update Ticket Urgency

### Command (using a ticket ID from previous tests):
```powershell
$ticketId = "your-ticket-id-here"

$body = @{ urgency = "critical" } | ConvertTo-Json

curl -X PATCH http://localhost:3000/tickets/$ticketId/urgency `
  -H "Content-Type: application/json" `
  -d $body
```

### Expected Output:
```json
{
  "ticket_id": "...",
  "urgency": "critical",
  "updated_at": "2026-05-25T..."
}
```

✅ **What happened:**
- ✓ Urgency updated
- ✓ Timestamp updated
- ✓ Change applied immediately

---

## TEST SCENARIO 10: Update Ticket Status

### Command:
```powershell
$ticketId = "your-ticket-id-here"

$body = @{ status = "in_progress" } | ConvertTo-Json

curl -X PATCH http://localhost:3000/tickets/$ticketId/status `
  -H "Content-Type: application/json" `
  -d $body
```

### Expected Output:
```json
{
  "ticket_id": "...",
  "status": "in_progress",
  "updated_at": "2026-05-25T..."
}
```

✅ **What happened:**
- ✓ Status changed from "open" to "in_progress"
- ✓ State transition validated
- ✓ Update applied

---

## TEST SCENARIO 11: Try Invalid Status Transition

### Command (This should fail):
```powershell
$ticketId = "your-ticket-id-here"

# Try to go from "in_progress" back to "open" (invalid transition)
$body = @{ status = "open" } | ConvertTo-Json

curl -X PATCH http://localhost:3000/tickets/$ticketId/status `
  -H "Content-Type: application/json" `
  -d $body
```

### Expected Error:
```json
{
  "message": "Validation failed",
  "details": {
    "status": "Invalid status transition from 'in_progress' to 'open'"
  }
}
```

✅ **What happened:**
- ✓ Invalid state transition prevented
- ✓ Error message explains why
- ✓ Ticket unchanged

---

## TEST SCENARIO 12: Update Ticket Category

### Command:
```powershell
$ticketId = "your-ticket-id-here"

$body = @{ category = "network" } | ConvertTo-Json

curl -X PATCH http://localhost:3000/tickets/$ticketId/category `
  -H "Content-Type: application/json" `
  -d $body
```

### Expected Output:
- Ticket with updated category

---

## TEST SCENARIO 13: Update Confidence Score

### Command:
```powershell
$ticketId = "your-ticket-id-here"

$body = @{ confidence_score = 0.95 } | ConvertTo-Json

curl -X PATCH http://localhost:3000/tickets/$ticketId/confidence-score `
  -H "Content-Type: application/json" `
  -d $body
```

### Expected Output:
- Ticket with updated confidence_score

---

## TEST SCENARIO 14: Get Single Ticket

### Command:
```powershell
$ticketId = "your-ticket-id-here"

curl http://localhost:3000/tickets/$ticketId
```

### Expected Output:
- Full ticket object with all fields

---

## TEST SCENARIO 15: Run Automated Tests

### In a new terminal:
```powershell
cd c:\Users\Administrator\Desktop\Claude_Projects\csp-automation-api
npm test
```

### Expected Output:
- All tests pass
- Shows test results for both MCP and Tickets tests

---

## VERIFICATION CHECKLIST

After completing all test scenarios, verify:

- [ ] Server starts without errors
- [ ] Can create tickets
- [ ] Pipeline processes tickets automatically
- [ ] Urgency is classified correctly
- [ ] Category is assigned correctly
- [ ] PII is detected and redacted
- [ ] Confidence scores are calculated
- [ ] High confidence tickets auto-close
- [ ] Low confidence tickets stay open
- [ ] Critical tickets escalate
- [ ] Security tickets escalate
- [ ] Can list tickets
- [ ] Can filter by status, urgency, category
- [ ] Can search tickets
- [ ] Can update ticket fields
- [ ] Can get individual tickets
- [ ] Invalid transitions are rejected
- [ ] All tests pass

---

## TROUBLESHOOTING

### Issue: "Cannot POST /tickets"
- **Solution:** Make sure server is running in first terminal

### Issue: Connection Refused
- **Solution:** Server may not be running. Check first terminal for "running on port 3000"

### Issue: Empty response
- **Solution:** Wait a moment, then try curl again. Pipeline takes a moment to process

### Issue: Tests fail
- **Solution:** Make sure server is NOT running (tests start their own server). Kill the main server first

### Issue: Port 3000 already in use
- **Solution:** Change PORT env var or kill process using port 3000
  ```powershell
  # Find what's using port 3000
  netstat -ano | findstr :3000
  # Kill the process (replace PID with actual number)
  taskkill /PID <PID> /F
  ```

---

## API QUICK REFERENCE

| Operation | Method | URL | Body |
|-----------|--------|-----|------|
| Create Ticket | POST | /tickets | `{subject, description, submitter_ref}` |
| List Tickets | GET | /tickets?status=open&urgency=high | - |
| Get Ticket | GET | /tickets/{id} | - |
| Update Status | PATCH | /tickets/{id}/status | `{status}` |
| Update Urgency | PATCH | /tickets/{id}/urgency | `{urgency}` |
| Update Category | PATCH | /tickets/{id}/category | `{category}` |
| Update Confidence | PATCH | /tickets/{id}/confidence-score | `{confidence_score}` |

---

## Sample Complete Workflow

```powershell
# 1. Create a ticket
$create = curl -X POST http://localhost:3000/tickets `
  -H "Content-Type: application/json" `
  -d '{"subject":"Test","description":"Testing","submitter_ref":"user"}'
$ticketId = ($create | ConvertFrom-Json).ticket_id

# 2. Wait for processing
Start-Sleep -Seconds 2

# 3. Get the ticket
$ticket = curl http://localhost:3000/tickets/$ticketId | ConvertFrom-Json
Write-Host "Status: $($ticket.status)"
Write-Host "Urgency: $($ticket.urgency)"
Write-Host "Confidence: $($ticket.confidence_score)"

# 4. Update if needed
curl -X PATCH http://localhost:3000/tickets/$ticketId/status `
  -H "Content-Type: application/json" `
  -d '{"status":"in_progress"}'

# 5. Verify update
curl http://localhost:3000/tickets/$ticketId | ConvertFrom-Json | Select status
```

---

## Summary

You now have a complete testing guide! The system will:

1. ✅ Accept ticket submissions
2. ✅ Automatically detect and redact PII
3. ✅ Classify by urgency and category
4. ✅ Search documentation
5. ✅ Generate responses with confidence scores
6. ✅ Escalate when needed
7. ✅ Log all events
8. ✅ Update via REST API
9. ✅ Filter and search tickets
10. ✅ Provide MCP tools for Claude integration

Happy testing!
