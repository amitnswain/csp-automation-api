/**
 * Researcher Subagent
 * Looks up product documentation and produces contextually accurate draft responses
 */

const { mockDocumentation } = require("./mock-documentation");

/**
 * Simulate searching documentation for relevant information
 * @param {string} query - Search query based on ticket content
 * @param {string} topic - Ticket topic category
 * @returns {Array} Relevant documentation snippets
 */
function searchDocumentation(query, topic) {
  const relevantDocs = [];
  const lowerQuery = query.toLowerCase();

  // Search through mock documentation
  for (const doc of mockDocumentation) {
    const relevanceScore = 0;

    // Check if document matches topic
    if (doc.topic === topic || topic === "other") {
      // Check title and content for query terms
      if (doc.title.toLowerCase().includes(lowerQuery) ||
          doc.content.toLowerCase().includes(lowerQuery)) {
        relevantDocs.push({
          ...doc,
          relevance: 0.8 + Math.random() * 0.2 // Simulate relevance scoring
        });
      }
      // Also check if any keywords match
      else if (doc.keywords && doc.keywords.some(keyword =>
                lowerQuery.includes(keyword.toLowerCase()))) {
        relevantDocs.push({
          ...doc,
          relevance: 0.6 + Math.random() * 0.3
        });
      }
    }
  }

  // Sort by relevance and return top results
  return relevantDocs
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 3); // Return top 3 most relevant documents
}

/**
 * Generate a draft response based on research findings
 * @param {Array} documentation - Relevant documentation snippets
 * @param {string} ticketTitle - Original ticket title
 * @param {string} ticketDescription - Original ticket description
 * @returns {Object} Draft response and confidence score
 */
function generateDraftResponse(documentation, ticketTitle, ticketDescription) {
  if (documentation.length === 0) {
    return {
      draft_response: "I've searched our knowledge base but couldn't find specific information to resolve this issue. A human agent will investigate further and provide a detailed solution.",
      confidence: 0.3
    };
  }

  // Generate response based on the most relevant documentation
  const topDoc = documentation[0];

  // Template responses based on documentation type
  let response = "";

  if (topDoc.topic === "technical" || topDoc.topic === "software") {
    response = `Based on our technical documentation:\n\n${topDoc.content}\n\nPlease try the steps outlined above and let us know if the issue persists.`;
  } else if (topDoc.topic === "hardware") {
    response = `According to our hardware guide:\n\n${topDoc.content}\n\nIf you continue to experience issues with your device, we may need to arrange for a replacement or repair.`;
  } else if (topDoc.topic === "network") {
    response = `From our networking documentation:\n\n${topDoc.content}\n\nPlease follow these steps and contact us if you're still unable to establish a connection.`;
  } else if (topDoc.topic === "access_request" || topDoc.topic === "security") {
    response = `Per our security and access policies:\n\n${topDoc.content}\n\nIf you need further assistance with access permissions, please provide additional details about your specific requirements.`;
  } else if (topDoc.topic === "billing") {
    response = `According to our billing information:\n\n${topDoc.content}\n\nPlease review this information and let us know if you have any questions about charges or payments.`;
  } else {
    response = `Here's what I found in our knowledge base:\n\n${topDoc.content}\n\nHopefully this addresses your question. If not, please provide more details so we can better assist you.`;
  }

  // Calculate confidence based on documentation relevance and completeness
  const baseConfidence = topDoc.relevance;
  const topicMatchBoost = documentation.some(doc => doc.topic !== "other") ? 0.1 : 0;
  const multipleSourcesBoost = documentation.length > 1 ? 0.05 : 0;

  let confidence = baseConfidence + topicMatchBoost + multipleSourcesBoost;
  confidence = Math.min(0.95, confidence); // Cap at 95%

  return {
    draft_response: response,
    confidence: Number(confidence.toFixed(2))
  };
}

/**
 * Main researcher function that looks up documentation and produces draft responses
 * @param {Object} ticketData - Ticket information
 * @param {string} ticketData.subject - Ticket subject (one-line summary)
 * @param {string} ticketData.description - Ticket description
 * @param {string} ticketData.category - Ticket topic from triage
 * @returns {Object} Research result with draft response and confidence score
 */
async function researchTicket(ticketData) {
  const { subject, description, category } = ticketData;

  // Create search query from ticket subject and description
  const searchQuery = `${subject} ${description}`;

  // Search documentation
  const relevantDocs = searchDocumentation(searchQuery, category);

  // Generate draft response
  const result = generateDraftResponse(relevantDocs, subject, description);

  return {
    draft_response: result.draft_response,
    confidence: result.confidence,
    sources_found: relevantDocs.length,
    research_timestamp: new Date().toISOString()
  };
}

module.exports = {
  researchTicket
};