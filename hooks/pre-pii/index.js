/**
 * PII Pre-Hook
 * Detects and redacts Personally Identifiable Information (PII) before AI processing
 */

/**
 * PII detection patterns
 */
const PII_PATTERNS = {
  // Name patterns (first name, last name, titles)
  person_name: [
    /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // John Smith
    /\b(?:Mr\.|Mrs\.|Ms\.|Dr\.) [A-Z][a-z]+ [A-Z][a-z]+\b/g, // Mr. John Smith
    /\b[A-Z][a-z]+, [A-Z][a-z]+\b/g // Smith, John
  ],

  // Email addresses
  email: [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
  ],

  // Phone numbers (various formats)
  phone: [
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // 123-456-7890 or 1234567890
    /\b\(\d{3}\) \d{3}[-.]?\d{4}\b/g, // (123) 456-7890
    /\b\d{3} \d{3} \d{4}\b/g, // 123 456 7890
    /\+\d{1,3}[-.]?\d{1,4}[-.]?\d{1,4}[-.]?\d{1,4}\b/g // International format
  ],

  // Physical addresses (simplified)
  address: [
    /\b\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Ct|Circle|Cir|Plaza|Pl)\b/gi,
    /\b(?:Unit|Apt|Apartment|Suite|Ste|#)\s*\d+[-,]?\s*\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Ct|Circle|Cir|Plaza|Pl)\b/gi
  ],

  // Account numbers (various formats)
  account_number: [
    /\b(?:account|acct|acc)[\s#:]*\d{6,12}\b/gi,
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card style grouping
    /\b(?:routing|rt)[\s#:]*\d{9}\b/gi
  ],

  // Payment data (credit card numbers)
  payment: [
    /\b(?:\d[ -]*?){13,16}\b/g, // Basic credit card pattern
    /\b(?:Visa|Mastercard|American Express|Discover)[\s:]*\d[\d\s-]*\d\b/gi
  ],

  // IP addresses (sometimes considered PII in certain contexts)
  ip_address: [
    /\b(?:\d{1,3}\.){3}\d{1,3}\b/g
  ],

  // Date of birth (common formats)
  date_of_birth: [
    /\b(?:0[1-9]|1[0-2])[\/](?:0[1-9]|[12]\d|3[01])[\/]\d{4}\b/g, // MM/DD/YYYY
    /\b(?:0[1-9]|[12]\d|3[01])[\/](?:0[1-9]|1[0-2])[\/]\d{4}\b/g // DD/MM/YYYY
  ]
};

/**
 * Redaction placeholders for different PII types
 */
const REDACTION_PLACEHOLDERS = {
  person_name: "[REDACTED_PERSON_NAME]",
  email: "[REDACTED_EMAIL]",
  phone: "[REDACTED_PHONE]",
  address: "[REDACTED_ADDRESS]",
  account_number: "[REDACTED_ACCOUNT_NUMBER]",
  payment: "[REDACTED_PAYMENT_INFO]",
  ip_address: "[REDACTED_IP_ADDRESS]",
  date_of_birth: "[REDACTED_DATE_OF_BIRTH]"
};

/**
 * Detect PII in text and return matches with types
 * @param {string} text - Text to scan for PII
 * @returns {Array} Array of PII matches with type and position
 */
function detectPii(text) {
  const matches = [];

  for (const [piiType, patterns] of Object.entries(PII_PATTERNS)) {
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        matches.push({
          type: piiType,
          value: match[0],
          position: match.index,
          length: match[0].length
        });
      }
    }
  }

  // Sort by position to process in order
  return matches.sort((a, b) => a.position - b.position);
}

/**
 * Redact PII in text by replacing with appropriate placeholders
 * @param {string} text - Text to redact
 * @returns {Object} Redacted text and detection results
 */
function redactPii(text) {
  const matches = detectPii(text);

  if (matches.length === 0) {
    return {
      redacted_text: text,
      pii_detected: false,
      matches: []
    };
  }

  // Process matches from end to beginning to maintain positions
  let redactedText = text;
  const redactedMatches = [];

  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    const placeholder = REDACTION_PLACEHOLDERS[match.type] || "[REDACTED]";

    // Replace the match with placeholder
    redactedText =
      redactedText.substring(0, match.position) +
      placeholder +
      redactedText.substring(match.position + match.length);

    redactedMatches.unshift({
      type: match.type,
      original_value: match.value,
      redacted_value: placeholder,
      position: match.position
    });
  }

  return {
    redacted_text: redactedText,
    pii_detected: true,
    matches: redactedMatches
  };
}

/**
 * Main PII pre-hook function
 * @param {Object} ticketData - Ticket information
 * @param {string} ticketData.description - Ticket description to check for PII
 * @returns {Object} Result with redacted description and PII detection info
 */
async function prePiiHook(ticketData) {
  const { description } = ticketData;

  if (!description) {
    return {
      redacted_description: description,
      pii_detected: false,
      matches: []
    };
  }

  const result = redactPii(description);

  return {
    redacted_description: result.redacted_text,
    pii_detected: result.pii_detected,
    matches: result.matches
  };
}

module.exports = {
  prePiiHook,
  detectPii,
  redactPii
};