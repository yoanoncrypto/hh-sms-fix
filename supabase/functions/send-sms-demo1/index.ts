import { serve } from "https://deno.land/std@0.224.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SMSRequest {
  recipients: string[];
  message: string;
  sender?: string;
  test?: boolean;
  param1?: string;
}

interface SMSAPIResponse {
  count?: number;
  list?: Array<{
    id: string;
    points: number;
    number: string;
    date_sent: number;
    submitted_number: string;
    status: string;
  }>;
  invalid_numbers?: Array<{
    number: string;
    submitted_number: string;
    message: string;
  }>;
  error?: number;
  message?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { recipients, message, sender = 'BulkComm', test = false, param1 }: SMSRequest = await req.json()

    // Validate input
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Recipients array is required and cannot be empty' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!message || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Message content is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get SMSAPI credentials from environment
    const SMSAPI_TOKEN = Deno.env.get('SMSAPI_TOKEN')
    if (!SMSAPI_TOKEN) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'SMSAPI token not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare SMS API request
    const smsApiUrl = 'https://api.smsapi.bg/sms.do'
    
    // Handle both array and string recipients for backward compatibility
    const recipientsString = Array.isArray(recipients) ? recipients.join(',') : recipients
    
    // Prepare form data
    const formData = new URLSearchParams()
    formData.append('to', recipientsString)
    formData.append('message', message.trim())
    formData.append('from', sender)
    formData.append('format', 'json')
    formData.append('encoding', 'utf-8')
    
    // Add personalization parameter if provided
    if (param1) {
      formData.append('param1', param1)
    }
    
    if (test) {
      formData.append('test', '1')
    }

    // Send SMS via SMSAPI.bg
    const smsResponse = await fetch(smsApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SMSAPI_TOKEN}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const responseText = await smsResponse.text()
    let smsData: SMSAPIResponse

    try {
      smsData = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse SMSAPI response:', responseText)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid response from SMS provider',
          details: responseText
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if SMS sending was successful
    if (smsData.error) {
      const errorMessages: { [key: number]: string } = {
        11: 'Message too long or contains invalid characters',
        13: 'No valid phone numbers provided',
        14: 'Invalid sender name',
        101: 'Invalid authorization',
        103: 'Insufficient credits',
        105: 'IP address not allowed',
        112: 'Sending to this country is restricted',
        203: 'Too many requests, please try again later'
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessages[smsData.error] || `SMS API Error: ${smsData.message || smsData.error}`,
          errorCode: smsData.error,
          invalidNumbers: smsData.invalid_numbers || []
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Success response
    const sentCount = smsData.count || 0
    const messageIds = smsData.list?.map(item => item.id) || []
    const totalCost = smsData.list?.reduce((sum, item) => sum + item.points, 0) || 0

    return new Response(
      JSON.stringify({
        success: true,
        sentCount,
        totalRecipients: recipients.length,
        messageIds,
        cost: totalCost,
        currency: 'EUR',
        details: {
          sent: smsData.list || [],
          invalid: smsData.invalid_numbers || []
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('SMS sending error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: {
          type: 'internal_error',
          timestamp: new Date().toISOString()
        }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})