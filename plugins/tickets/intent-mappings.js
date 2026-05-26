/**
 * Intent Mappings for Tickets Plugin
 * Defines how the system should respond to different ticket characteristics
 */

// Export the intent mappings from the main index file for easy access
const TicketsPlugin = require('./index');

module.exports = {
  INTENT_MAPPINGS: TicketsPlugin.INTENT_MAPPINGS,

  // Convenience functions for accessing specific mapping categories
  getUrgencyIntents: () => TicketsPlugin.INTENT_MAPPINGS.urgency_intents,
  getTopicIntents: () => TicketsPlugin.INTENT_MAPPINGS.topic_intents,
  getConfidenceIntents: () => TicketsPlugin.INTENT_MAPPINGS.confidence_intents
};