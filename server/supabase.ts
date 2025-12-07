/**
 * Supabase Service Layer
 * Handles all interactions with Supabase database
 * Reads chatbot conversation data for dashboard analytics
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ENV } from './_core/env';

let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize Supabase client
 */
export function initSupabase(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_KEY environment variables are required');
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
}

/**
 * Get Supabase client instance
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    return initSupabase();
  }
  return supabaseClient;
}

/**
 * Interface for conversation data from Supabase
 */
export interface ConversationRecord {
  id?: string;
  user_id: string;
  user_message: string;
  bot_response: string;
  timestamp: string;
  context_used?: string;
  language_code?: string;
  session_id?: string;
  intent?: string;
  sentiment?: string;
  urgency?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetch all conversations from Supabase
 */
export async function getAllConversations(limit: number = 1000): Promise<ConversationRecord[]> {
  const supabase = getSupabase();
  
  try {
    const { data, error } = await supabase
      .from('interactions')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return [];
  }
}

/**
 * Fetch conversations by date range
 */
export async function getConversationsByDateRange(
  startDate: string,
  endDate: string
): Promise<ConversationRecord[]> {
  const supabase = getSupabase();
  
  try {
    const { data, error } = await supabase
      .from('interactions')
      .select('*')
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching conversations by date range:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch conversations by date range:', error);
    return [];
  }
}

/**
 * Fetch conversations by user
 */
export async function getConversationsByUser(userId: string): Promise<ConversationRecord[]> {
  const supabase = getSupabase();
  
  try {
    const { data, error } = await supabase
      .from('interactions')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching conversations by user:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch conversations by user:', error);
    return [];
  }
}

/**
 * Fetch conversations by sentiment
 */
export async function getConversationsBySentiment(sentiment: string): Promise<ConversationRecord[]> {
  const supabase = getSupabase();
  
  try {
    const { data, error } = await supabase
      .from('interactions')
      .select('*')
      .eq('sentiment', sentiment)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching conversations by sentiment:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch conversations by sentiment:', error);
    return [];
  }
}

/**
 * Fetch conversations by intent
 */
export async function getConversationsByIntent(intent: string): Promise<ConversationRecord[]> {
  const supabase = getSupabase();
  
  try {
    const { data, error } = await supabase
      .from('interactions')
      .select('*')
      .eq('intent', intent)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching conversations by intent:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch conversations by intent:', error);
    return [];
  }
}

/**
 * Get conversation statistics
 */
export async function getConversationStats(): Promise<{
  totalConversations: number;
  uniqueUsers: number;
  averageResponseLength: number;
  sentimentBreakdown: Record<string, number>;
  intentBreakdown: Record<string, number>;
}> {
  const conversations = await getAllConversations(10000);

  if (conversations.length === 0) {
    return {
      totalConversations: 0,
      uniqueUsers: 0,
      averageResponseLength: 0,
      sentimentBreakdown: {},
      intentBreakdown: {},
    };
  }

  // Calculate stats
  const uniqueUsers = new Set(conversations.map(c => c.user_id)).size;
  const totalLength = conversations.reduce((sum, c) => sum + (c.bot_response?.length || 0), 0);
  const averageResponseLength = Math.round(totalLength / conversations.length);

  // Sentiment breakdown
  const sentimentBreakdown: Record<string, number> = {};
  conversations.forEach(c => {
    const sentiment = (c as any).sentiment || 'unknown';
    sentimentBreakdown[sentiment] = (sentimentBreakdown[sentiment] || 0) + 1;
  });

  // Intent breakdown
  const intentBreakdown: Record<string, number> = {};
  conversations.forEach(c => {
    const intent = (c as any).intent || 'unknown';
    intentBreakdown[intent] = (intentBreakdown[intent] || 0) + 1;
  });

  return {
    totalConversations: conversations.length,
    uniqueUsers,
    averageResponseLength,
    sentimentBreakdown,
    intentBreakdown,
  };
}

/**
 * Test Supabase connection
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('interactions')
      .select('count(*)', { count: 'exact', head: true });

    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }

    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return false;
  }
}
