import { randomBytes } from 'node:crypto';
import SessionModel from '../models/Session';

const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Creates a new admin session and returns the session token.
 * Persisted in MongoDB for resilience across server restarts.
 */
export const createAdminSession = async (): Promise<string> => {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL);
  
  await SessionModel.create({ token, expiresAt });
  
  return token;
};

/**
 * Verifies if the provided token is a valid admin session.
 * Returns true if valid, false otherwise.
 */
export const verifyAdminSession = async (token: string): Promise<boolean> => {
  try {
    const session = await SessionModel.findOne({ 
      token, 
      expiresAt: { $gt: new Date() } 
    });
    
    return !!session;
  } catch (error) {
    console.error('[Session] Verification error:', error);
    return false;
  }
};

