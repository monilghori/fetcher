import { DhanQuoteResponse } from './types';
import { fetch as undiciFetch } from 'undici';

const DHAN_API_BASE = 'https://api.dhan.co';
const NIFTY50_SECURITY_ID = 13; // Nifty 50 Index security ID as number

export async function fetchNifty50Quote(): Promise<DhanQuoteResponse> {
  const accessToken = process.env.DHAN_ACCESS_TOKEN;
  const clientId = process.env.DHAN_CLIENT_ID;
  
  if (!accessToken || !clientId) {
    throw new Error('Dhan API credentials not configured. Please set DHAN_ACCESS_TOKEN and DHAN_CLIENT_ID in .env.local');
  }
  
  if (accessToken === 'your_dhan_access_token_here' || clientId === 'your_dhan_client_id_here') {
    throw new Error('Dhan API credentials are placeholder values. Please update with real credentials in .env.local');
  }
  
  // Correct request body format for Dhan API
  // Format: { "NSE_FNO": [13] } - security ID as number, not string
  const requestBody = {
    "NSE_FNO": [NIFTY50_SECURITY_ID]
  };
  
  console.log('🌐 Making request to:', `${DHAN_API_BASE}/v2/marketfeed/quote`);
  console.log('📝 Request body:', JSON.stringify(requestBody));
  console.log('📝 Headers:', {
    'Content-Type': 'application/json',
    'access-token': accessToken.substring(0, 20) + '...',
    'client-id': clientId
  });
  
  try {
    const response = await undiciFetch(`${DHAN_API_BASE}/v2/marketfeed/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken,
        'client-id': clientId,
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log('📥 Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error body:', errorText);
      
      if (response.status === 400) {
        throw new Error(`Dhan API bad request (400). The request format may be incorrect. Response: ${errorText}`);
      } else if (response.status === 401) {
        throw new Error(`Dhan API authentication failed (401). Check your DHAN_ACCESS_TOKEN and DHAN_CLIENT_ID. Response: ${errorText}`);
      } else if (response.status === 403) {
        throw new Error(`Dhan API access forbidden (403). Your credentials may be invalid or expired. Response: ${errorText}`);
      } else if (response.status === 429) {
        throw new Error(`Dhan API rate limit exceeded (429). Please wait before making more requests. Response: ${errorText}`);
      } else if (response.status >= 500) {
        throw new Error(`Dhan API server error (${response.status}). The service may be temporarily unavailable. Response: ${errorText}`);
      } else {
        throw new Error(`Dhan API error (${response.status}): ${errorText}`);
      }
    }
    
    const data: any = await response.json();
    console.log('✅ Response data received:', JSON.stringify(data).substring(0, 500) + '...');
    
    // Validate response structure
    if (!data || !data.data) {
      throw new Error('Dhan API returned invalid response structure. Missing data field.');
    }
    
    // The response structure is: { data: { "13": { last_price: ..., open: ..., etc } } }
    const niftyData = data.data[NIFTY50_SECURITY_ID.toString()];
    if (!niftyData) {
      throw new Error(`Dhan API response missing data for security ID ${NIFTY50_SECURITY_ID}`);
    }
    
    // Transform to expected format
    const transformedData = {
      data: {
        last_price: niftyData.last_price || niftyData.ltp,
        open: niftyData.open,
        high: niftyData.high,
        low: niftyData.low,
        close: niftyData.close || niftyData.prev_close,
        volume: niftyData.volume,
        oi: niftyData.oi || niftyData.open_interest,
        net_change: niftyData.change || (niftyData.last_price - niftyData.prev_close),
        percent_change: niftyData.percent_change || ((niftyData.last_price - niftyData.prev_close) / niftyData.prev_close * 100)
      }
    };
    
    console.log('✅ Transformed data:', JSON.stringify(transformedData));
    
    return transformedData as DhanQuoteResponse;
  } catch (error: any) {
    console.error('💥 Fetch error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      cause: error.cause
    });
    
    if (error.message?.includes('fetch') || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new Error(`Network error connecting to Dhan API: ${error.message}. Check your internet connection and firewall settings.`);
    }
    throw error;
  }
}

export async function fetchNifty50LTP(): Promise<number> {
  const accessToken = process.env.DHAN_ACCESS_TOKEN;
  const clientId = process.env.DHAN_CLIENT_ID;
  
  if (!accessToken || !clientId) {
    throw new Error('Dhan API credentials not configured. Please set DHAN_ACCESS_TOKEN and DHAN_CLIENT_ID in .env.local');
  }
  
  if (accessToken === 'your_dhan_access_token_here' || clientId === 'your_dhan_client_id_here') {
    throw new Error('Dhan API credentials are placeholder values. Please update with real credentials in .env.local');
  }
  
  // Correct request body format for Dhan API
  // Format: { "NSE_FNO": [13] } - security ID as number, not string
  const requestBody = {
    "NSE_FNO": [NIFTY50_SECURITY_ID]
  };
  
  try {
    const response = await fetch(`${DHAN_API_BASE}/v2/marketfeed/ltp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken,
        'client-id': clientId,
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status === 400) {
        throw new Error(`Dhan API bad request (400). The request format may be incorrect. Response: ${errorText}`);
      } else if (response.status === 401) {
        throw new Error(`Dhan API authentication failed (401). Check your DHAN_ACCESS_TOKEN and DHAN_CLIENT_ID. Response: ${errorText}`);
      } else if (response.status === 403) {
        throw new Error(`Dhan API access forbidden (403). Your credentials may be invalid or expired. Response: ${errorText}`);
      } else if (response.status === 429) {
        throw new Error(`Dhan API rate limit exceeded (429). Please wait before making more requests. Response: ${errorText}`);
      } else if (response.status >= 500) {
        throw new Error(`Dhan API server error (${response.status}). The service may be temporarily unavailable. Response: ${errorText}`);
      } else {
        throw new Error(`Dhan API error (${response.status}): ${errorText}`);
      }
    }
    
    const data: any = await response.json();
    
    // Validate response structure
    // Response format: { data: { "13": { ltp: 22450.75 } } }
    if (!data || !data.data || !data.data[NIFTY50_SECURITY_ID.toString()]) {
      throw new Error('Dhan API returned invalid response structure. Missing or invalid last_price field.');
    }
    
    const ltp = data.data[NIFTY50_SECURITY_ID.toString()].ltp || data.data[NIFTY50_SECURITY_ID.toString()].last_price;
    
    if (typeof ltp !== 'number') {
      throw new Error('Dhan API returned invalid LTP value.');
    }
    
    return ltp;
  } catch (error: any) {
    if (error.message?.includes('fetch')) {
      throw new Error(`Network error connecting to Dhan API: ${error.message}. Check your internet connection.`);
    }
    throw error;
  }
}
