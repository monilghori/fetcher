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
  // Nifty 50 is an INDEX, so we use IDX_I segment, not NSE_FNO
  const requestBody = {
    "IDX_I": [NIFTY50_SECURITY_ID]
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
    console.log('✅ Response data received (FULL):', JSON.stringify(data, null, 2));
    
    // Validate response structure
    if (!data || !data.data) {
      throw new Error('Dhan API returned invalid response structure. Missing data field.');
    }
    
    console.log('📊 Data keys:', Object.keys(data.data));
    console.log('📊 Looking for security ID:', NIFTY50_SECURITY_ID, 'as string:', NIFTY50_SECURITY_ID.toString());
    
    // Response structure: { data: { "IDX_I": { "13": { ... } } } }
    const idxData = data.data['IDX_I'] || data.data['NSE_FNO'];
    
    if (!idxData) {
      console.error('❌ No IDX_I or NSE_FNO data in response');
      throw new Error('Dhan API response missing segment data');
    }
    
    // Try different possible keys
    let niftyData = idxData[NIFTY50_SECURITY_ID.toString()] || 
                    idxData[NIFTY50_SECURITY_ID] ||
                    idxData['13'] ||
                    idxData[13];
    
    if (!niftyData) {
      // If still not found, check if data is directly in the response
      if (data.last_price || data.ltp) {
        niftyData = data;
      } else {
        console.error('❌ Available keys in segment:', Object.keys(idxData));
        console.error('❌ Full response:', JSON.stringify(data, null, 2));
        throw new Error(`Dhan API response missing data for security ID ${NIFTY50_SECURITY_ID}. Available keys: ${Object.keys(idxData).join(', ')}`);
      }
    }
    
    console.log('✅ Found Nifty data:', JSON.stringify(niftyData, null, 2));
    
    // Log all available fields
    console.log('📋 Available fields in response:', Object.keys(niftyData));
    
    // Extract values with fallbacks and detailed logging
    const ltp = niftyData.last_price || niftyData.ltp || niftyData.LTP || 0;
    const prevClose = niftyData.prev_close || niftyData.close || niftyData.previous_close || niftyData.prevClose || 0;
    const open = niftyData.open || niftyData.open_price || niftyData.OPEN || 0;
    const high = niftyData.high || niftyData.high_price || niftyData.HIGH || 0;
    const low = niftyData.low || niftyData.low_price || niftyData.LOW || 0;
    const volume = niftyData.volume || niftyData.VOLUME || niftyData.vol || 0;
    const oi = niftyData.oi || niftyData.open_interest || niftyData.OI || niftyData.openInterest || 0;
    
    console.log('📊 Extracted values:');
    console.log('  LTP:', ltp);
    console.log('  Open:', open);
    console.log('  High:', high);
    console.log('  Low:', low);
    console.log('  Prev Close:', prevClose);
    console.log('  Volume:', volume);
    console.log('  OI:', oi);
    
    // Calculate change and percent change
    let netChange = 0;
    let percentChange = 0;
    
    if (prevClose && prevClose > 0) {
      netChange = ltp - prevClose;
      percentChange = (netChange / prevClose) * 100;
      console.log('✅ Using prev_close for calculation');
    } else if (open && open > 0) {
      // Fallback: use open price if prev_close not available
      netChange = ltp - open;
      percentChange = (netChange / open) * 100;
      console.log('⚠️ Using open price for calculation (prev_close not available)');
    } else {
      console.log('⚠️ Cannot calculate change - no reference price available');
    }
    
    // Transform to expected format
    const transformedData = {
      data: {
        last_price: ltp,
        open: open || null,
        high: high || null,
        low: low || null,
        close: prevClose || null,
        volume: volume || null,
        oi: oi || null,
        net_change: netChange,
        percent_change: percentChange
      }
    };
    
    console.log('✅ Transformed data:', JSON.stringify(transformedData, null, 2));
    console.log('📊 Final calculations: LTP=' + ltp + ', PrevClose=' + prevClose + ', Change=' + netChange.toFixed(2) + ', %Change=' + percentChange.toFixed(2) + '%');
    
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
  // Nifty 50 is an INDEX, so we use IDX_I segment, not NSE_FNO
  const requestBody = {
    "IDX_I": [NIFTY50_SECURITY_ID]
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
    // Response format: { data: { "IDX_I": { "13": { ltp: 22450.75 } } } }
    const idxData = data.data['IDX_I'] || data.data['NSE_FNO'];
    
    if (!idxData || !idxData[NIFTY50_SECURITY_ID.toString()]) {
      throw new Error('Dhan API returned invalid response structure. Missing or invalid last_price field.');
    }
    
    const ltp = idxData[NIFTY50_SECURITY_ID.toString()].ltp || idxData[NIFTY50_SECURITY_ID.toString()].last_price;
    
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
