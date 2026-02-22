import { randomBytes, createHash } from 'node:crypto';
import SessionModel from '../models/Session';

const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Helper to hash session tokens (Defense in Depth)
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/**
 * Creates a new admin session and returns the session token.
 * Persisted in MongoDB for resilience across server restarts.
 */
export const createAdminSession = async (): Promise<string> => {
  const token = randomBytes(32).toString('hex');
  const hashedToken = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL);
  
  // Store only the hash in the database
  await SessionModel.create({ token: hashedToken, expiresAt });
  
  return token; // Return raw token to client
};

/**
 * Verifies if the provided token is a valid admin session.
 * Returns true if valid, false otherwise.
 */
export const verifyAdminSession = async (token: string): Promise<boolean> => {
  try {
    const hashedToken = hashToken(token);
    const session = await SessionModel.findOne({ 
      token: hashedToken,
      expiresAt: { $gt: new Date() } 
    });
    
    return !!session;
  } catch (error) {
    console.error('[Session] Verification error:', error);
    return false;
  }
};

