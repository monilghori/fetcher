import { NextResponse } from 'next/server';

// This would need to be shared with lib/dhan.ts in a real implementation
// For now, this is a simple endpoint to check if we should wait

export async function GET() {
  // In a production app, you'd check the actual rate limit state
  // For now, just return a helpful message
  
  return NextResponse.json({
    status: 'ok',
    message: 'Rate limit status check',
    recommendation: 'If you hit rate limits, wait 5-10 minutes before testing again',
    tips: [
      'Increase POLLING_INTERVAL_MS to 5000 (5 seconds)',
      'Reduce TEST_MODE_DURATION_MS to 30000 (30 seconds)',
      'Wait between test runs',
      'Use test mode sparingly'
    ]
  });
}
