import { NextRequest, NextResponse } from 'next/server';
import { Agent, fetch as undiciFetch } from 'undici';

const DHAN_API_BASE = 'https://api.dhan.co';

// Create agent with TLS options for development
const agent = process.env.NODE_ENV === 'development' 
  ? new Agent({ connect: { rejectUnauthorized: false } })
  : undefined;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, clientId } = body;
    
    if (!accessToken || !clientId) {
      return NextResponse.json({ 
        error: 'Missing credentials'
      }, { status: 400 });
    }
    
    // Test multiple endpoints and formats
    const tests = [];
    
    // Test 1: LTP endpoint with IDX_I
    try {
      const response1 = await undiciFetch(`${DHAN_API_BASE}/v2/marketfeed/ltp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access-token': accessToken,
          'client-id': clientId,
        },
        body: JSON.stringify({ "IDX_I": [13] }),
        dispatcher: agent
      });
      
      const data1 = await response1.text();
      tests.push({
        endpoint: '/v2/marketfeed/ltp',
        segment: 'IDX_I',
        status: response1.status,
        statusText: response1.statusText,
        headers: Object.fromEntries(response1.headers.entries()),
        body: data1
      });
    } catch (error: any) {
      tests.push({
        endpoint: '/v2/marketfeed/ltp',
        segment: 'IDX_I',
        error: error.message
      });
    }
    
    // Test 2: Quote endpoint with IDX_I
    try {
      const response2 = await undiciFetch(`${DHAN_API_BASE}/v2/marketfeed/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access-token': accessToken,
          'client-id': clientId,
        },
        body: JSON.stringify({ "IDX_I": [13] }),
        dispatcher: agent
      });
      
      const data2 = await response2.text();
      tests.push({
        endpoint: '/v2/marketfeed/quote',
        segment: 'IDX_I',
        status: response2.status,
        statusText: response2.statusText,
        headers: Object.fromEntries(response2.headers.entries()),
        body: data2
      });
    } catch (error: any) {
      tests.push({
        endpoint: '/v2/marketfeed/quote',
        segment: 'IDX_I',
        error: error.message
      });
    }
    
    // Test 3: Quote endpoint with NSE_FNO
    try {
      const response3 = await undiciFetch(`${DHAN_API_BASE}/v2/marketfeed/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access-token': accessToken,
          'client-id': clientId,
        },
        body: JSON.stringify({ "NSE_FNO": [13] }),
        dispatcher: agent
      });
      
      const data3 = await response3.text();
      tests.push({
        endpoint: '/v2/marketfeed/quote',
        segment: 'NSE_FNO',
        status: response3.status,
        statusText: response3.statusText,
        headers: Object.fromEntries(response3.headers.entries()),
        body: data3
      });
    } catch (error: any) {
      tests.push({
        endpoint: '/v2/marketfeed/quote',
        segment: 'NSE_FNO',
        error: error.message
      });
    }
    
    return NextResponse.json({
      message: 'Validation test results',
      credentials: {
        accessTokenLength: accessToken.length,
        accessTokenPreview: accessToken.substring(0, 10) + '...',
        clientId: clientId
      },
      tests: tests
    });
    
  } catch (error: any) {
    return NextResponse.json({
      error: 'Test failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
