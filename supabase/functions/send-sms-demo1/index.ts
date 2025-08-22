import { createClient } from 'npm:@supabase/supabase-js@2.39.0'

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
  campaignId?: string;
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

interface ProcessedRecipient {
  phoneNumber: string;
  userId: string;
  personalizedLink?: string;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { recipients, message, sender = 'BulkComm', test = false, campaignId }: SMSRequest = await req.json()

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

    // Initialize Supabase client with service role key for full database access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const publicBaseUrl = Deno.env.get('PUBLIC_BASE_URL') || 'https://your-domain.com'

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Supabase configuration missing' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if message contains link placeholder
    const hasLinkPlaceholder = message.includes('{{ link }}')
    let campaignShortId: string | null = null

    // If campaign ID is provided and message has link placeholder, fetch campaign short_id once
    if (campaignId && hasLinkPlaceholder) {
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('short_id')
        .eq('id', campaignId)
        .single()

      if (campaignError) {
        console.error('Failed to fetch campaign short_id:', campaignError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Campaign not found or invalid campaign ID' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      campaignShortId = campaignData.short_id
    }

    // Process all recipients to handle user creation and campaign recipient management
    const processedRecipients: ProcessedRecipient[] = []
    const errors: string[] = []

    // Helper function to detect country from phone number
    const detectCountryFromPhone = (phone: string): string => {
      const prefixes: { [prefix: string]: string } = {
        '+359': 'BG', '+380': 'UA', '+48': 'PL', '+40': 'RO', '+36': 'HU',
        '+420': 'CZ', '+421': 'SK', '+385': 'HR', '+386': 'SI', '+381': 'RS',
        '+49': 'DE', '+33': 'FR', '+39': 'IT', '+34': 'ES', '+31': 'NL',
        '+32': 'BE', '+43': 'AT', '+41': 'CH', '+44': 'GB', '+1': 'US'
      }

      for (const [prefix, country] of Object.entries(prefixes)) {
        if (phone.startsWith(prefix)) {
          return country
        }
      }
      return 'Unknown'
    }

    // Step 1: Get all existing users in a single query
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('id, phone_number')
      .in('phone_number', recipients)

    if (usersError) {
      console.error('Failed to fetch existing users:', usersError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch existing users from database' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const existingUserMap = new Map(existingUsers.map(u => [u.phone_number, u.id]))

    // Step 2: Identify new users that need to be created
    const newUsers = recipients
      .filter(phone => !existingUserMap.has(phone))
      .map(phone => ({
        phone_number: phone,
        country: detectCountryFromPhone(phone),
        status: 'active' as const
      }))

    // Step 3: Batch insert new users if any
    let newUserMap = new Map<string, string>()
    if (newUsers.length > 0) {
      const { data: insertedUsers, error: insertError } = await supabase
        .from('users')
        .insert(newUsers)
        .select('id, phone_number')

      if (insertError) {
        console.error('Failed to insert new users:', insertError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to create new users in database' 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      newUserMap = new Map(insertedUsers.map(u => [u.phone_number, u.id]))
    }

    // Step 4: Create user ID mapping for all recipients
    const userIdMap = new Map<string, string>()
    for (const phone of recipients) {
      const userId = existingUserMap.get(phone) || newUserMap.get(phone)
      if (userId) {
        userIdMap.set(phone, userId)
      }
    }

    // Step 5: Handle campaign recipients if campaign ID is provided
    let campaignRecipientMap = new Map<string, string>() // phone -> unique_token
    if (campaignId) {
      // Get existing campaign recipients for this campaign and all user IDs
      const userIds = Array.from(userIdMap.values())
      const { data: existingRecipients, error: recipientsError } = await supabase
        .from('campaign_recipients')
        .select('user_id, unique_token')
        .eq('campaign_id', campaignId)
        .in('user_id', userIds)

      if (recipientsError) {
        console.error('Failed to fetch existing campaign recipients:', recipientsError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to fetch existing campaign recipients' 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const existingRecipientMap = new Map(existingRecipients.map(r => [r.user_id, r.unique_token]))

      // Identify new campaign recipients that need to be created
      const newCampaignRecipients = []
      const recipientTokenMap = new Map<string, string>() // phone -> unique_token

      for (const phone of recipients) {
        const userId = userIdMap.get(phone)
        if (!userId) continue

        const existingToken = existingRecipientMap.get(userId)
        if (existingToken) {
          // Use existing token
          recipientTokenMap.set(phone, existingToken)
        } else {
          // Generate new token for new recipient
          const uniqueToken = Math.random().toString(36).substring(2, 10).toUpperCase()
          recipientTokenMap.set(phone, uniqueToken)
          newCampaignRecipients.push({
            campaign_id: campaignId,
            user_id: userId,
            status: 'sent',
            unique_token: uniqueToken
          })
        }
      }

      // Batch insert new campaign recipients
      if (newCampaignRecipients.length > 0) {
        const { error: insertRecipientsError } = await supabase
          .from('campaign_recipients')
          .insert(newCampaignRecipients)

        if (insertRecipientsError) {
          console.error('Failed to insert campaign recipients:', insertRecipientsError)
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Failed to create campaign recipients' 
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
      }

      // Update existing campaign recipients status to 'sent'
      const existingUserIds = Array.from(existingRecipientMap.keys())
      if (existingUserIds.length > 0) {
        const { error: updateError } = await supabase
          .from('campaign_recipients')
          .update({ status: 'sent' })
          .eq('campaign_id', campaignId)
          .in('user_id', existingUserIds)

        if (updateError) {
          console.error('Failed to update existing campaign recipients:', updateError)
          // Don't fail the entire operation for this, just log it
        }
      }

      campaignRecipientMap = recipientTokenMap
    }

    // Step 6: Generate personalized links if needed
    const personalizedLinks: string[] = []
    if (hasLinkPlaceholder) {
      for (const phone of recipients) {
        if (campaignId && campaignShortId && campaignRecipientMap.has(phone)) {
          // Use campaign short_id link
          const token = campaignRecipientMap.get(phone)
          personalizedLinks.push(`${publicBaseUrl}/c/${campaignShortId}?token=${token}`)
        } else if (campaignRecipientMap.has(phone)) {
          // Use direct token link
          const token = campaignRecipientMap.get(phone)
          personalizedLinks.push(`${publicBaseUrl}/${token}`)
        } else {
          // Fallback to generic link
          personalizedLinks.push(`${publicBaseUrl}`)
        }
      }
    }

    // Step 7: Prepare message for SMS API
    let finalMessage = message.trim()
    let param1Value: string | undefined

    if (hasLinkPlaceholder && personalizedLinks.length > 0) {
      // Replace {{ link }} with [%1%] for SMSAPI.bg personalization
      finalMessage = finalMessage.replace(/\{\{\s*link\s*\}\}/g, '[%1%]')
      param1Value = personalizedLinks.join('|')
    }

    // Step 8: Get SMSAPI credentials and send SMS
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
    const recipientsString = recipients.join(',')
    
    const formData = new URLSearchParams()
    formData.append('to', recipientsString)
    formData.append('message', finalMessage)
    formData.append('from', sender)
    formData.append('format', 'json')
    formData.append('encoding', 'utf-8')
    
    if (param1Value) {
      formData.append('param1', param1Value)
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

    // Step 9: Handle SMS API errors
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

      // Log failed bulk message
      if (!test) {
        await supabase.from('bulk_messages').insert({
          type: 'sms',
          content: message,
          recipient_count: recipients.length,
          sent_count: 0,
          status: 'failed',
          completed_at: new Date().toISOString(),
          campaign_id: campaignId || null,
        })
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

    // Step 10: Process successful SMS response
    const sentCount = smsData.count || 0
    const messageIds = smsData.list?.map(item => item.id) || []
    const totalCost = smsData.list?.reduce((sum, item) => sum + item.points, 0) || 0

    // Step 11: Update campaign recipient statuses based on SMS API response
    if (campaignId && smsData.list) {
      const successfulNumbers = new Set(smsData.list.map(item => item.number))
      const failedNumbers = new Set((smsData.invalid_numbers || []).map(item => item.number))

      // Update successful recipients
      if (successfulNumbers.size > 0) {
        const successfulUserIds = recipients
          .filter(phone => successfulNumbers.has(phone))
          .map(phone => userIdMap.get(phone))
          .filter(Boolean)

        if (successfulUserIds.length > 0) {
          await supabase
            .from('campaign_recipients')
            .update({ status: 'sent' })
            .eq('campaign_id', campaignId)
            .in('user_id', successfulUserIds)
        }
      }

      // Note: We don't update failed recipients to 'failed' status as they might be retried
      // The 'sent' status in campaign_recipients indicates the SMS was successfully queued/sent
    }

    // Step 12: Log successful bulk message (only if not test mode)
    if (!test) {
      const { error: logError } = await supabase.from('bulk_messages').insert({
        type: 'sms',
        content: message,
        recipient_count: recipients.length,
        sent_count: sentCount,
        status: sentCount > 0 ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
        campaign_id: campaignId || null,
      })

      if (logError) {
        console.error('Failed to log bulk message:', logError)
        // Don't fail the entire operation for logging issues
      }
    }

    // Step 13: Return success response
    return new Response(
      JSON.stringify({
        success: true,
        sentCount,
        totalRecipients: recipients.length,
        messageIds,
        cost: totalCost,
        currency: 'EUR',
        invalidNumbers: smsData.invalid_numbers || [],
        details: {
          sent: smsData.list || [],
          invalid: smsData.invalid_numbers || [],
          errors: errors.length > 0 ? errors : undefined
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