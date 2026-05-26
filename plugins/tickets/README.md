# Tickets Plugin

This plugin provides intent mappings and structured guidance for ticket processing operations, helping the system determine appropriate responses and actions based on ticket characteristics.

## Functionality

The tickets plugin:
1. Defines intent mappings based on urgency levels, topic categories, and confidence scores
2. Provides recommended actions and next steps for ticket processing
3. Calculates estimated effort levels for resource planning
4. Suggests appropriate human roles for different ticket types
5. Enables consistent decision-making across the support pipeline

## Intent Mappings

The plugin includes three main categories of intent mappings:

### 1. Urgency-Based Intents
Mapping urgency levels to appropriate responses:
- **critical**: IMMEDIATE_ESCALATION (security team, network admin, system admin)
- **high**: EXPEDITED_RESOLUTION (technical support, system admin)
- **medium**: STANDARD_PROCESSING (technical support)
- **low**: SELF_SERVICE_OR_SCHEDULED (self-service portal, technical support)

### 2. Topic-Based Intents
Mapping topic categories to appropriate responses:
- **billing**: BILLING_INQUIRY (billing specialist)
- **technical**: TECHNICAL_TROUBLESHOOTING (technical support, system admin)
- **feature_request**: PRODUCT_FEEDBACK (product manager, development team)
- **security**: SECURITY_INCIDENT (security team, incident response)
- **access_request**: PERMISSION_MANAGEMENT (security team, system admin, helpdesk lead)
- **hardware**: HARDWARE_SUPPORT (hardware technician, field support)
- **software**: SOFTWARE_SUPPORT (application support, system admin)
- **network**: NETWORK_CONNECTIVITY (network team, helpdesk)
- **other**: GENERAL_INQUIRY (helpdesk tier 1)

### 3. Confidence-Based Intents
Mapping AI confidence scores to human review requirements:
- **high confidence (≥0.8)**: AUTO_RESOLUTION (no human review needed)
- **medium confidence (0.5-0.79)**: AI_ASSISTED (human review before sending)
- **low confidence (<0.5)**: HUMAN_REQUIRED (human-generated response)

## Key Features

### Recommended Action Determination
Combines urgency, topic, and confidence to determine:
- Primary intent (what action to take)
- Whether human review is required
- Estimated effort level
- Suggested next steps for processing

### Resource Planning
- Estimates effort levels (low, medium, high) for ticket
- Suggests appropriate human roles based on ticket characteristics
- Provides typical resolution timeframes for planning

### Process Guidance
- Provides step-by-step guidance for different ticket types
- Ensures consistent handling across agents and shifts
- Includes both AI-assisted and human-led workflows

## Usage

```javascript
const TicketsPlugin = require('./plugins/tickets');

// Get recommended action for a ticket
const ticket = {
  urgency_level: "high",
  topic_category": "technical",
  researcher_confidence: 0.72,
  status: "in_progress"
};

const action = TicketsPlugin.getRecommendedAction(ticket);

console.log(action.primary_intent);
// "AI_ASSISTED"

console.log(action.human_review_required);
// true

console.log(action.estimated_effort);
// "medium"

console.log(action.suggested_next_steps);
// [
//   "Review AI-generated draft response for accuracy",
//   "Customize response based on specific circumstances",
//   "Add any additional troubleshooting steps as needed",
//   "Review resolution steps taken",
//   "Follow up with user to confirm issue resolved",
//   "Update knowledge base if new information discovered"
// ]
```

### Getting Specific Intent Mappings

```javascript
// Get urgency-based intent
const urgencyIntent = TicketsPlugin.getUrgencyIntent("critical");
console.log(urgencyIntent.primary_intent);
// "IMMEDIATE_ESCALATION"

// Get topic-based intent
const topicIntent = TicketsPlugin.getTopicIntent("security");
console.log(topicIntent.primary_intent);
// "SECURITY_INCIDENT"

// Get confidence-based intent
const confidenceIntent = TicketsPlugin.getConfidenceIntent(0.85);
console.log(confidenceIntent.primary_intent);
// "AUTO_RESOLUTION"
```

## Integration Points

The plugin is designed to be used at various points in the ticket lifecycle:

1. **After Triage**: Determine initial processing approach
2. **After Research**: Decide on response delivery method
3. **Before Escalation**: Verify escalation appropriateness
4. **For Reporting**: Generate metrics on ticket characteristics
5. **For Training**: Provide guidance to new support agents

## Customization

Intent mappings can be customized by modifying:
- `INTENT_MAPPINGS` object in `index.js`
- Thresholds for confidence levels
- Suggested next steps for different scenarios
- Estimated timeframes and required roles

The plugin is designed to be extensible for additional dimensions such as:
- Customer tier/VIP status
- Product line or service area
- Language or regional considerations
- Contractual SLAs or response time requirements