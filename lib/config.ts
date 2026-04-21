/**
 * Application Configuration
 * Centralized configuration for polling intervals and other settings
 */

export const CONFIG = {
  /**
   * Polling interval in milliseconds for auto-fetching data during collection window
   * Default: 3000ms (3 seconds)
   * 
   * Recommended values:
   * - 1000ms (1 second) - High frequency, more API calls
   * - 2000ms (2 seconds) - Balanced
   * - 3000ms (3 seconds) - Default, conservative
   * - 5000ms (5 seconds) - Low frequency, fewer API calls
   * 
   * Note: Lower intervals = more data points but higher API usage
   */
  POLLING_INTERVAL_MS: 3000,

  /**
   * Test mode duration in milliseconds
   * Default: 60000ms (60 seconds / 1 minute)
   */
  TEST_MODE_DURATION_MS: 60000,

  /**
   * Rate limit handling
   */
  RATE_LIMIT: {
    /**
     * Initial delay after hitting rate limit (ms)
     */
    INITIAL_BACKOFF_MS: 10000,
    
    /**
     * Maximum backoff delay (ms)
     */
    MAX_BACKOFF_MS: 120000,
    
    /**
     * Backoff multiplier for exponential backoff
     */
    BACKOFF_MULTIPLIER: 2,
    
    /**
     * Maximum number of retry attempts
     */
    MAX_RETRIES: 3,
  },

  /**
   * Collection window times (IST)
   */
  COLLECTION_WINDOW: {
    START_HOUR: 14,
    START_MINUTE: 55,
    END_HOUR: 15,
    END_MINUTE: 5,
  },
} as const;

/**
 * Helper function to format interval for display
 */
export function formatInterval(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  return seconds === 1 ? '1 second' : `${seconds} seconds`;
}
