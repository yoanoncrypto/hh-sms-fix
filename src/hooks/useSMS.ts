import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface SMSRequest {
  recipients: string[];
  message: string;
  sender?: string;
  test?: boolean;
  campaignId?: string;
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
  errors?: string[];
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

      // Process recipients in batches to respect SMSAPI.bg limits
      const batchSize = 250; // SMSAPI.bg limit for personalized messages
      const batches = [];
      
      for (let i = 0; i < validRecipients.length; i += batchSize) {
        batches.push(validRecipients.slice(i, i + batchSize));
      }

      // Aggregate results from all batches
      const aggregatedResults = {
        success: true,
        sentCount: 0,
        totalRecipients: validRecipients.length,
        messageIds: [] as string[],
        cost: 0,
        currency: 'EUR',
        invalidNumbers: [] as any[],
        errors: [] as string[]
      };

      // Process each batch
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        try {
          // Call the optimized Edge Function for this batch
          const { data: batchResult, error: batchError } = await supabase.functions.invoke('send-sms-demo1', {
            body: {
              recipients: batch,
              message: request.message.trim(),
              sender: request.sender || 'BulkComm',
              test: request.test || false,
              campaignId: request.campaignId
            },
          });

          if (batchError) {
            aggregatedResults.errors.push(`Batch ${batchIndex + 1}: ${batchError.message}`);
            continue;
          }

          if (batchResult?.success) {
            // Aggregate successful results
            aggregatedResults.sentCount += batchResult.sentCount || 0;
            if (batchResult.messageIds) {
              aggregatedResults.messageIds.push(...batchResult.messageIds);
            }
            if (batchResult.cost) {
              aggregatedResults.cost += batchResult.cost;
            }
            if (batchResult.invalidNumbers) {
              aggregatedResults.invalidNumbers.push(...batchResult.invalidNumbers);
            }
          } else {
            aggregatedResults.errors.push(`Batch ${batchIndex + 1}: ${batchResult?.error || 'Unknown error'}`);
            if (batchResult?.invalidNumbers) {
              aggregatedResults.invalidNumbers.push(...batchResult.invalidNumbers);
            }
          }
        } catch (error) {
          aggregatedResults.errors.push(`Batch ${batchIndex + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Update progress
        const progressPercent = Math.round(((batchIndex + 1) / batches.length) * 100);
        setProgress(progressPercent);
      }

      // Determine overall success
      if (aggregatedResults.sentCount === 0) {
        aggregatedResults.success = false;
        aggregatedResults.error = aggregatedResults.errors.length > 0 
          ? aggregatedResults.errors[0] 
          : 'No messages were sent successfully';
      }

      return aggregatedResults;

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

  // Remove the old sendBulkSMS and logSMSCampaign functions as they're now handled by the Edge Function

  return {
    sendSMS,
    sendSingleSMS,
    testSMS,
    sending,
    progress,
  };
};