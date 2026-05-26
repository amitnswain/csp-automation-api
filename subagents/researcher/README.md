# Researcher Subagent

This subagent searches product documentation and generates contextually accurate draft responses for support tickets.

## Functionality

The researcher subagent:
1. Takes ticket information (title, description, topic category)
2. Searches a knowledge base of mock documentation for relevant information
3. Generates a draft response based on the most relevant documentation
4. Provides a confidence score indicating the reliability of the generated response

## Knowledge Base

The system includes a mock knowledge base covering:
- Network troubleshooting (VPN, Wi-Fi, connectivity)
- Software installation and updates
- Hardware issues (laptops, cameras, peripherals)
- Security procedures (password reset, account lockout, incident reporting)
- Access requests and permissions
- Billing and subscription inquiries
- Feature requests and feedback processes
- General IT support guidance

## Response Generation

Responses are generated using templates based on documentation topics:
- Technical/Software: Step-by-step troubleshooting guides
- Hardware: Device-specific diagnostic and repair procedures
- Network: Connectivity troubleshooting steps
- Security: Access and incident response procedures
- Billing: Invoice and subscription information
- Access Request: Permission request processes
- Feature Request: Submission guidelines
- General: Knowledge base search suggestions

## Confidence Scoring

Confidence scores (0.0-1.0) are calculated based on:
- Document relevance to query (0.6-0.8 base)
- Topic match bonus (+0.1 if specific topic matched)
- Multiple sources bonus (+0.05 if multiple relevant docs found)
- Capped at maximum 0.95 confidence

## Usage

```javascript
const { researchTicket } = require('./subagents/researcher');

const result = await researchTicket({
  title: "VPN connection failing",
  description: "Unable to connect to corporate VPN after password reset",
  topic_category: "network"
});

console.log(result);
// {
//   draft_response: "Based on our technical documentation:\n\nTo resolve VPN connection issues: 1) Check your internet connection, 2) Verify VPN server address is correct, 3) Ensure your credentials are up to date, 4) Try restarting the VPN client, 5) Check if your company firewall is blocking VPN ports (typically UDP 500, 4500 and ESP protocol 50), 6) Contact IT if the issue persists after trying these steps.\n\nPlease try the steps outlined above and let us know if the issue persists.",
//   confidence: 0.88,
//   sources_found: 1,
//   research_timestamp: "2026-05-24T10:30:00.000Z"
// }
```