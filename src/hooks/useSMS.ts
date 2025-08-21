import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface SMSRequest {
  recipients: string[];
  message: string;
  sender?: string;
  test?: boolean;
  campaignId?: string;
  param1?: string;
}

interface SMSResponse {
  success: boolean;
  sentCount?: number;
  totalRecipients?: number;
  messageIds?: string[];
  cost?: number;
  currency?: string;
  error?: string;
  errorCode?: number;
  invalidNumbers?: Array<{
    number: string;
    submitted_number: string;
    message: string;
  }>;
  details?: any;
}

export const useSMS = () => {
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);

  const sendSMS = async (request: SMSRequest): Promise<SMSResponse> => {
    setSending(true);
    setProgress(0);

    try {
      // Validate recipients
      if (!request.recipients || request.recipients.length === 0) {
        throw new Error('No recipients provided');
      }

      // Filter out null/undefined recipients
      const validRecipients = request.recipients.filter(phone => 
        phone && phone.trim() && phone !== 'null' && phone !== 'undefined'
      );

      if (validRecipients.length === 0) {
        throw new Error('No valid recipients found');
      }

      // Check if message contains {{ link }} placeholder
      const hasLinkPlaceholder = request.message.includes('{{ link }}');
      
      // If no campaign ID or link placeholder, send as bulk SMS (original behavior)
      if (!request.campaignId && !hasLinkPlaceholder) {
        return await sendBulkSMS(validRecipients, request.message, request.sender, request.test);
      }
      
      // For personalized messages, use bulk personalization with batching
      const results = {
        success: true,
        sentCount: 0,
        totalRecipients: validRecipients.length,
        messageIds: [] as string[],
        cost: 0,
        currency: 'EUR',
        invalidNumbers: [] as any[],
        errors: [] as string[]
      };
      
      const { normalizePhoneNumber, detectCountryFromPhone } = await import('../utils/phoneValidation');
      
      // Process recipients in batches of up to 100 (SMSAPI.bg limit for personalized messages)
      const batchSize = 100;
      const batches = [];
      
      for (let i = 0; i < validRecipients.length; i += batchSize) {
        batches.push(validRecipients.slice(i, i + batchSize));
      }
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const batchRecipients: string[] = [];
        const batchLinks: string[] = [];
        
        // Process each recipient in the batch to get tokens
        for (const phone of batch) {
        const normalizedPhone = normalizePhoneNumber(phone);
        
        try {
          let uniqueToken = '';
          
          // If campaign ID is provided, create/get campaign recipient record
          if (request.campaignId) {
            // First, get the campaign's short_id for the link
            const { data: campaignData, error: campaignFetchError } = await supabase
              .from('campaigns')
              .select('short_id')
              .eq('id', request.campaignId)
              .single();
            
            if (campaignFetchError) {
              console.error('Failed to fetch campaign short_id:', campaignFetchError);
            }
            
            // Find or create user
            let userId: string;
            const { data: existingUser, error: userError } = await supabase
              .from('users')
              .select('id')
              .eq('phone_number', normalizedPhone)
              .single();
            
            if (userError) {
              // Create new user
              const country = detectCountryFromPhone(normalizedPhone) || 'Unknown';
              const { data: newUser, error: createUserError } = await supabase
                .from('users')
                .insert([{ 
                  phone_number: normalizedPhone,
                  country,
                  status: 'active'
                }])
                .select('id')
                .single();
              
              if (createUserError) throw createUserError;
              userId = newUser.id;
            } else {
              userId = existingUser.id;
            }
            
            // Find or create campaign recipient
            const { data: existingRecipient, error: recipientError } = await supabase
              .from('campaign_recipients')
              .select('unique_token')
              .eq('campaign_id', request.campaignId)
              .eq('user_id', userId)
              .single();
            
            if (recipientError) {
              // Create new campaign recipient with unique token
              uniqueToken = Math.random().toString(36).substring(2, 10).toUpperCase();
              
              const { error: createRecipientError } = await supabase
                .from('campaign_recipients')
                .insert([{
                  campaign_id: request.campaignId,
                  user_id: userId,
                  status: 'sent',
                  unique_token: uniqueToken
                }]);
              
              if (createRecipientError) throw createRecipientError;
            } else {
              uniqueToken = existingRecipient.unique_token;
              
              // Update status to sent if it was different
              await supabase
                .from('campaign_recipients')
                .update({ status: 'sent' })
                .eq('campaign_id', request.campaignId)
                .eq('user_id', userId);
            }
          } else if (hasLinkPlaceholder) {
            // Generate a simple token for non-campaign links
            uniqueToken = Math.random().toString(36).substring(2, 10).toUpperCase();
          }
          
          batchRecipients.push(normalizedPhone);
          batchLinks.push(hasLinkPlaceholder && uniqueToken ? `${window.location.origin}/${uniqueToken}` : '');
          
        } catch (error) {
          results.errors.push(`${normalizedPhone}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          // Still add to batch but with empty token
          batchRecipients.push(normalizedPhone);
          batchLinks.push('');
        }
      }
      
      // Send batch SMS with personalization
      try {
        // Replace {{ link }} with [%1%] for SMSAPI.bg personalization
        const batchMessage = hasLinkPlaceholder 
          ? request.message.replace(/\{\{\s*link\s*\}\}/g, '[%1%]')
          : request.message;
        
        const { data: smsData, error: smsError } = await supabase.functions.invoke('send-sms-demo1', {
          body: {
            recipients: batchRecipients,
            message: batchMessage.trim(),
            sender: request.sender || 'BulkComm',
            test: request.test || false,
            param1: hasLinkPlaceholder ? batchLinks.join('|') : undefined
          },
        });
        
        if (smsError) {
          results.errors.push(`Batch ${batchIndex + 1}: ${smsError.message}`);
        } else if (smsData?.success) {
          results.sentCount += smsData.sentCount || 0;
          if (smsData.messageIds) {
            results.messageIds.push(...smsData.messageIds);
          }
          if (smsData.cost) {
            results.cost += smsData.cost;
          }
        } else {
          results.errors.push(`Batch ${batchIndex + 1}: ${smsData?.error || 'Unknown error'}`);
          if (smsData?.invalidNumbers) {
            results.invalidNumbers.push(...smsData.invalidNumbers);
          }
        }
        
      } catch (error) {
        results.errors.push(`Batch ${batchIndex + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
        
        // Update progress
        const progressPercent = Math.round(((batchIndex + 1) / batches.length) * 90);
        setProgress(progressPercent);
      }

      setProgress(100);

      // Determine overall success
      if (results.sentCount === 0) {
        results.success = false;
        results.error = results.errors.length > 0 ? results.errors[0] : 'No messages were sent successfully';
      }

      // Log successful SMS campaign to database
      if (results.success && results.sentCount > 0) {
        await logSMSCampaign({
          type: 'sms',
          content: request.message,
          recipientCount: validRecipients.length,
          sentCount: results.sentCount,
          status: 'completed',
          cost: results.cost,
          messageIds: results.messageIds,
          campaignId: request.campaignId
        });
      }

      return results;
    } catch (error) {
      console.error('SMS sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    } finally {
      setSending(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  // Helper function for bulk SMS (when no personalization is needed)
  const sendBulkSMS = async (recipients: string[], message: string, sender?: string, test?: boolean, param1?: string): Promise<SMSResponse> => {
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-sms-demo1', {
        body: {
          recipients,
          message: message.trim(),
          sender: sender || 'BulkComm',
          test: test || false,
          param1
        },
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) {
        let errorMessage = 'SMS sending failed';
        
        if (error.message?.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to SMS service. Please check your internet connection and Supabase configuration.';
        } else if (error.message?.includes('non-2xx status')) {
          errorMessage = 'SMS service returned an error. Please check that SMSAPI_TOKEN is configured in Supabase Edge Functions settings.';
        } else if (error.context?.error) {
          errorMessage = error.context.error;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      clearInterval(progressInterval);
      throw error;
    }
  };

  const sendSingleSMS = async (phoneNumber: string, message: string, sender?: string, campaignId?: string): Promise<SMSResponse> => {
    return sendSMS({
      recipients: [phoneNumber],
      message,
      sender,
      campaignId
    });
  };

  const testSMS = async (request: SMSRequest): Promise<SMSResponse> => {
    return sendSMS({
      ...request,
      test: true
    });
  };

  const logSMSCampaign = async (campaignData: {
    type: string;
    content: string;
    recipientCount: number;
    sentCount: number;
    status: string;
    cost?: number;
    messageIds?: string[];
    campaignId?: string;
  }) => {
    try {
      await supabase.from('bulk_messages').insert({
        type: campaignData.type,
        content: campaignData.content,
        recipient_count: campaignData.recipientCount,
        sent_count: campaignData.sentCount,
        status: campaignData.status,
        completed_at: new Date().toISOString(),
        campaign_id: campaignData.campaignId || null,
      });
    } catch (error) {
      console.error('Failed to log SMS campaign:', error);
    }
  };

  return {
    sendSMS,
    sendSingleSMS,
    sendBulkSMS,
    testSMS,
    sending,
    progress,
  };
};