/**
 * Utility functions for generating and validating short IDs
 */

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const SHORT_ID_LENGTH = 5;

/**
 * Generate a random 5-character alphanumeric string
 */
export const generateShortId = (): string => {
  let result = '';
  for (let i = 0; i < SHORT_ID_LENGTH; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
};

/**
 * Validate if a string is a valid short ID format
 */
export const isValidShortId = (shortId: string): boolean => {
  if (!shortId || shortId.length !== SHORT_ID_LENGTH) {
    return false;
  }
  
  return /^[A-Z0-9]{5}$/.test(shortId);
};

/**
 * Generate a unique short ID by checking against existing ones
 * This is a client-side helper - server-side validation is still needed
 */
export const generateUniqueShortId = async (
  checkExists: (shortId: string) => Promise<boolean>,
  maxAttempts: number = 100
): Promise<string> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const shortId = generateShortId();
    const exists = await checkExists(shortId);
    
    if (!exists) {
      return shortId;
    }
  }
  
  throw new Error(`Could not generate unique short ID after ${maxAttempts} attempts`);
};