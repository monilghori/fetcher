import { NextRequest, NextResponse } from 'next/server';
import { Agent, fetch as undiciFetch } from 'undici';

const DHAN_API_BASE = 'https://api.dhan.co';
const NIFTY50_SECURITY_ID = 13;

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
        valid: false,
        error: 'Missing Credentials',
        message: 'Access token and client ID are required'
      }, { status: 400 });
    }
    
    // Test the credentials with a simple API call
    const requestBody = {
      "IDX_I": [NIFTY50_SECURITY_ID]
    };
    
    try {
      console.log('Testing credentials with Dhan API...');
      console.log('API URL:', `${DHAN_API_BASE}/v2/marketfeed/ltp`);
      console.log('Request body:', JSON.stringify(requestBody));
      console.log('Access token (first 10 chars):', accessToken.substring(0, 10) + '...');
      console.log('Client ID:', clientId);
      
      const response = await undiciFetch(`${DHAN_API_BASE}/v2/marketfeed/ltp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access-token': accessToken,
          'client-id': clientId,
        },
        body: JSON.stringify(requestBody),
        dispatcher: agent
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.status === 401) {
        const errorBody = await response.text();
        console.log('401 Error body:', errorBody);
        return NextResponse.json({
          valid: false,
          error: 'Authentication Failed',
          message: 'Invalid access token. Please check your credentials.',
          errorCode: 'INVALID_TOKEN',
          details: errorBody
        });
      }
      
      if (response.status === 403) {
        const errorBody = await response.text();
        console.log('403 Error body:', errorBody);
        return NextResponse.json({
          valid: false,
          error: 'Access Forbidden',
          message: 'Your access token may have expired or been revoked. Please generate a new token from your Dhan account.',
          errorCode: 'TOKEN_EXPIRED',
          details: errorBody
        });
      }
      
      if (response.status === 400) {
        return NextResponse.json({
          valid: false,
          error: 'Invalid Client ID',
          message: 'The client ID appears to be incorrect. Please verify it from your Dhan account.',
          errorCode: 'INVALID_CLIENT_ID'
        });
      }
      
      if (response.status === 429) {
        return NextResponse.json({
          valid: false,
          error: 'Rate Limit Exceeded',
          message: 'Too many requests. Please wait a moment and try again.',
          errorCode: 'RATE_LIMIT'
        });
      }
      
      if (response.status >= 500) {
        return NextResponse.json({
          valid: false,
          error: 'Dhan API Error',
          message: 'Dhan API is temporarily unavailable. Please try again later.',
          errorCode: 'API_ERROR'
        });
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json({
          valid: false,
          error: 'API Error',
          message: `Dhan API returned error: ${errorText}`,
          errorCode: 'UNKNOWN_ERROR'
        });
      }
      
      // If we get here, credentials are valid
      const data: any = await response.json();
      
      // Verify we got valid data back
      if (!data || !data.data) {
        return NextResponse.json({
          valid: false,
          error: 'Invalid Response',
          message: 'Dhan API returned an unexpected response format.',
          errorCode: 'INVALID_RESPONSE'
        });
      }
      
      return NextResponse.json({
        valid: true,
        message: 'Credentials are valid and working correctly!',
        testData: {
          hasData: true,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (fetchError: any) {
      console.error('Validation fetch error:', fetchError);
      
      if (fetchError.code === 'ECONNREFUSED' || fetchError.code === 'ENOTFOUND') {
        return NextResponse.json({
          valid: false,
          error: 'Network Error',
          message: 'Unable to connect to Dhan API. Please check your internet connection.',
          errorCode: 'NETWORK_ERROR'
        });
      }
      
      return NextResponse.json({
        valid: false,
        error: 'Connection Error',
        message: `Failed to connect to Dhan API: ${fetchError.message}`,
        errorCode: 'CONNECTION_ERROR'
      });
    }
    
  } catch (error: any) {
    console.error('Validate credentials error:', error);
    return NextResponse.json({
      valid: false,
      error: 'Server Error',
      message: error.message || 'Failed to validate credentials',
      errorCode: 'SERVER_ERROR'
    }, { status: 500 });
  }
}
