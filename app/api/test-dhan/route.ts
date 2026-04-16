import { NextResponse } from 'next/server';
import { fetch as undiciFetch } from 'undici';

const DHAN_API_BASE = 'https://api.dhan.co';

export async function GET() {
  try {
    const accessToken = process.env.DHAN_ACCESS_TOKEN;
    const clientId = process.env.DHAN_CLIENT_ID;
    
    if (!accessToken || !clientId) {
      return NextResponse.json({ 
        error: 'Credentials not configured',
        message: 'DHAN_ACCESS_TOKEN and DHAN_CLIENT_ID must be set'
      }, { status: 500 });
    }
    
    // Test different request formats
    const tests = [
      {
        name: 'Format 1: NSE_FNO with number array',
        body: { "NSE_FNO": [13] }
      },
      {
        name: 'Format 2: NSE_FNO with string array',
        body: { "NSE_FNO": ["13"] }
      },
      {
        name: 'Format 3: IDX_I (Index segment)',
        body: { "IDX_I": [13] }
      },
      {
        name: 'Format 4: IDX_I with string',
        body: { "IDX_I": ["13"] }
      }
    ];
    
    const results = [];
    
    for (const test of tests) {
      try {
        const response = await undiciFetch(`${DHAN_API_BASE}/v2/marketfeed/quote`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access-token': accessToken,
            'client-id': clientId,
          },
          body: JSON.stringify(test.body),
        });
        
        const data = await response.json();
        
        results.push({
          test: test.name,
          requestBody: test.body,
          status: response.status,
          success: response.ok,
          response: data
        });
      } catch (error: any) {
        results.push({
          test: test.name,
          requestBody: test.body,
          error: error.message
        });
      }
    }
    
    return NextResponse.json({
      message: 'Dhan API Test Results',
      credentials: {
        hasAccessToken: !!accessToken,
        hasClientId: !!clientId,
        clientId: clientId
      },
      results: results
    }, { status: 200 });
    
  } catch (error: any) {
    return NextResponse.json({
      error: 'Test failed',
      message: error.message
    }, { status: 500 });
  }
}
