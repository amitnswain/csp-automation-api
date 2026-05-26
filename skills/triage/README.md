# Ticket Triage Skill

This skill automatically classifies incoming support tickets by urgency level and topic category.

## Functionality

The triage skill analyzes ticket titles and descriptions to determine:

### Urgency Levels
- **critical**: System-wide outages, security breaches, blocking issues
- **high**: Issues preventing work, urgent problems needing same-day resolution
- **medium**: Normal priority issues that can be scheduled
- **low**: Minor issues, suggestions, enhancements

### Topic Categories
- **billing**: Invoices, payments, subscription issues
- **technical**: Bugs, errors, performance problems
- **feature_request**: New feature requests, enhancements
- **security**: Security concerns, vulnerabilities, access issues
- **access_request**: Requests for system access, permissions
- **hardware**: Physical device issues
- **software**: Application installation, updates, configuration
- **network**: Connectivity, VPN, internet access issues
- **other**: General inquiries that don't fit other categories

## Classification Method

The skill uses keyword-based classification with weighted scoring:
1. Text is converted to lowercase for case-insensitive matching
2. Keywords from each category are matched against title + description
3. Urgency is determined by priority order: critical > high > medium > low
4. Topic is determined by highest keyword match score
5. Returns machine-readable JSON with classification results and confidence score

## Usage

```javascript
const { triageTicket } = require('./skills/triage');

const result = await triageTicket({
  title: "Cannot access payroll system",
  description": "Getting access denied error when trying to login to payroll portal",
  requester: "john.doe@company.com"
});

console.log(result);
// {
//   urgency_level: "high",
//   topic_category: "access_request",
//   classified_at: "2026-05-24T10:30:00.000Z",
//   confidence: 0.85
// }
```