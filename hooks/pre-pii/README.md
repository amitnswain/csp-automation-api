# PII Pre-Hook

This hook detects and redacts Personally Identifiable Information (PII) from ticket descriptions before any AI processing occurs, ensuring compliance with data protection regulations.

## Functionality

The PII pre-hook:
1. Scans ticket descriptions for various types of PII using regex patterns
2. Detects and logs all instances of PII found
3. Redacts PII by replacing with appropriate placeholders
4. Returns the sanitized text safe for AI processing
5. Sets a flag on the ticket indicating PII has been redacted

## PII Types Detected

The hook detects the following categories of PII:

### Personal Identifiers
- **Person Names**: Full names with titles (Mr. John Smith, Jane Doe)
- **Email Addresses**: Standard email format (user@domain.com)
- **Phone Numbers**: Various formats (123-456-7890, (123) 456-7890, +1-123-456-7890)
- **IP Addresses**: IPv4 addresses (192.168.1.1)

### Location Information
- **Physical Addresses**: Street addresses with common suffixes (Street, Ave, Rd, etc.)

### Financial Information
- **Account Numbers**: Bank account numbers, routing numbers
- **Payment Information**: Credit card numbers (13-16 digits with optional separators)

### Date Information
- **Date of Birth**: Common formats (MM/DD/YYYY, DD/MM/YYYY)

## Redaction Placeholders

Each PII type is replaced with a specific placeholder:
- `[REDACTED_PERSON_NAME]`
- `[REDACTED_EMAIL]`
- `[REDACTED_PHONE]`
- `[REDACTED_ADDRESS]`
- `[REDACTED_ACCOUNT_NUMBER]`
- `[REDACTED_PAYMENT_INFO]`
- `[REDACTED_IP_ADDRESS]`
- `[REDACTED_DATE_OF_BIRTH]`

## Processing Flow

1. Ticket arrives via REST API or MCP tool
2. Before any AI processing (triage, research, etc.), PII pre-hook is invoked
3. Description is scanned for PII
4. If PII found:
   - Original PII is logged (for audit trail, not stored with ticket)
   - Description is replaced with redacted version
   - Ticket's `pii_redacted` field is set to `true`
   - Processing log entry is added documenting the redaction
5. Redacted description is used for all subsequent AI processing
6. Original description remains in system for human agents who need to see it
7. AI-generated responses never contain raw PII

## Example

**Input Description:**
"Hi John Smith (john.smith@email.com, 555-123-4567), I can't access my account #1234567890. My credit card 4111-1111-1111-1111 was charged twice."

**After PII Pre-Hook:**
"Hi [REDACTED_PERSON_NAME] ([REDACTED_EMAIL], [REDACTED_PHONE]), I can't access my account [REDACTED_ACCOUNT_NUMBER]. My credit card [REDACTED_PAYMENT_INFO] was charged twice."

## Usage

```javascript
const { prePiiHook } = require('./hooks/pre-pii');

// Process ticket description before AI analysis
const ticketData = {
  description: "Contact Jane Doe at jane.doe@company.com or 555-987-6543 regarding account 987654321"
};

const result = await prePiiHook(ticketData);

console.log(result.redacted_description);
// "Contact [REDACTED_PERSON_NAME] at [REDACTED_EMAIL] or [REDACTED_PHONE] regarding account [REDACTED_ACCOUNT_NUMBER]"

console.log(result.pii_detected);
// true

console.log(result.matches.length);
// 3 (name, email, phone, account number - actually 4 matches)
```

## Compliance & Security

- **No Raw PII to AI**: Ensures PII never reaches external AI models
- **Audit Trail**: All PII detection is logged for compliance purposes
- **Reversible for Humans**: Original data preserved in system for authorized personnel
- **Configurable Patterns**: Easy to update regex patterns for new PII types or jurisdictions
- **Performance Optimized**: Efficient single-pass detection and replacement