/**
 * Local Authentication System
 * Simple username/password authentication for development
 * Uses JWT tokens for session management
 */

import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface LocalUser {
  id: string;
  username: string;
  email?: string;
  name?: string;
  createdAt: Date;
}

export interface AuthToken {
  token: string;
  user: LocalUser;
  expiresIn: number;
}

/**
 * Hash password (simple implementation - use bcrypt in production)
 */
function hashPassword(password: string): string {
  // For development only - use bcrypt in production
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Verify password
 */
function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/**
 * Create JWT token
 */
function createToken(user: LocalUser): AuthToken {
  const expiresIn = 7 * 24 * 60 * 60; // 7 days
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn }
  );

  return {
    token,
    user,
    expiresIn,
  };
}

/**
 * Verify JWT token
 */
function verifyToken(token: string): LocalUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      name: decoded.name,
      createdAt: new Date(decoded.createdAt),
    };
  } catch (error) {
    return null;
  }
}

/**
 * Sign up new user
 */
export async function signUp(
  username: string,
  password: string,
  email?: string,
  name?: string
): Promise<AuthToken> {
  // Validate input
  if (!username || !password) {
    throw new Error('Username and password are required');
  }

  if (username.length < 3) {
    throw new Error('Username must be at least 3 characters');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  try {
    // Check if user already exists
    const { data: existing } = await supabase
      .from('local_users')
      .select('id')
      .eq('username', username)
      .single();

    if (existing) {
      throw new Error('Username already exists');
    }

    // Create new user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const passwordHash = hashPassword(password);

    const { data, error } = await supabase
      .from('local_users')
      .insert([
        {
          id: userId,
          username,
          password_hash: passwordHash,
          email: email || null,
          name: name || null,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    const user: LocalUser = {
      id: data.id,
      username: data.username,
      email: data.email,
      name: data.name,
      createdAt: new Date(data.created_at),
    };

    return createToken(user);
  } catch (error: any) {
    throw new Error(`Sign up failed: ${error.message}`);
  }
}

/**
 * Sign in user
 */
export async function signIn(username: string, password: string): Promise<AuthToken> {
  if (!username || !password) {
    throw new Error('Username and password are required');
  }

  try {
    const { data, error } = await supabase
      .from('local_users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !data) {
      throw new Error('Invalid username or password');
    }

    // Verify password
    if (!verifyPassword(password, data.password_hash)) {
      throw new Error('Invalid username or password');
    }

    const user: LocalUser = {
      id: data.id,
      username: data.username,
      email: data.email,
      name: data.name,
      createdAt: new Date(data.created_at),
    };

    // Update last login
    await supabase
      .from('local_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    return createToken(user);
  } catch (error: any) {
    throw new Error(`Sign in failed: ${error.message}`);
  }
}

/**
 * Get user from token
 */
export function getUserFromToken(token: string): LocalUser | null {
  return verifyToken(token);
}

/**
 * Create local_users table if it doesn't exist
 */
export async function initializeAuthTable(): Promise<void> {
  try {
    // Check if table exists by trying to query it
    const { error } = await supabase
      .from('local_users')
      .select('id')
      .limit(1);

    if (error && error.code === 'PGRST116') {
      // Table doesn't exist, create it
      console.log('Creating local_users table...');
      // This should be done via Supabase SQL editor
      throw new Error(
        'local_users table does not exist. Please create it in Supabase with the following SQL:\n' +
        `CREATE TABLE local_users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          email TEXT,
          name TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          last_login TIMESTAMP,
          created_at_ts BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())
        );
        CREATE INDEX idx_username ON local_users(username);`
      );
    }
  } catch (error: any) {
    console.warn('Auth table initialization warning:', error.message);
  }
}
