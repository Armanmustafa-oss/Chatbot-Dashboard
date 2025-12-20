#!/usr/bin/env node

/**
 * Complete Setup and Test Script
 * This script will:
 * 1. Check if Supabase is configured
 * 2. Create demo users
 * 3. Test authentication
 * 4. Verify all settings
 */

import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nlqeexipesmiefqipeqg.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5scWVleGlwZXNtaWVmcWlwZXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMTIyNzMsImV4cCI6MjA3NDg4ODI3M30.mwGW3Q3GqQC4BKu7F17X_khH8KOiIZ6lwU_e45Pe4co';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

async function checkSupabaseConnection() {
  console.log('\n📡 Checking Supabase Connection...');
  try {
    const { data, error } = await supabase
      .from('local_users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase Error:', error.message);
      return false;
    }
    console.log('✅ Supabase Connected Successfully');
    return true;
  } catch (error) {
    console.error('❌ Connection Failed:', error.message);
    return false;
  }
}

async function createDemoUsers() {
  console.log('\n👥 Creating Demo Users...');
  
  const demoUsers = [
    {
      username: 'admin',
      password: 'password123',
      email: 'admin@example.com',
      name: 'Admin User'
    },
    {
      username: 'demo',
      password: 'demo123456',
      email: 'demo@example.com',
      name: 'Demo User'
    },
    {
      username: 'test',
      password: 'test123456',
      email: 'test@example.com',
      name: 'Test User'
    }
  ];

  for (const user of demoUsers) {
    try {
      // Check if user already exists
      const { data: existing } = await supabase
        .from('local_users')
        .select('id')
        .eq('username', user.username)
        .single();

      if (existing) {
        console.log(`⏭️  User "${user.username}" already exists, skipping...`);
        continue;
      }

      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const passwordHash = hashPassword(user.password);

      const { data, error } = await supabase
        .from('local_users')
        .insert([
          {
            id: userId,
            username: user.username,
            password_hash: passwordHash,
            email: user.email,
            name: user.name,
            created_at: new Date().toISOString(),
          }
        ])
        .select();

      if (error) {
        console.error(`❌ Error creating user ${user.username}:`, error.message);
      } else {
        console.log(`✅ Created user: ${user.username}`);
        console.log(`   Email: ${user.email}`);
      }
    } catch (error) {
      console.error(`❌ Exception for ${user.username}:`, error.message);
    }
  }
}

async function listAllUsers() {
  console.log('\n📋 All Users in Database:');
  try {
    const { data, error } = await supabase
      .from('local_users')
      .select('id, username, email, name, created_at');

    if (error) {
      console.error('❌ Error fetching users:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️  No users found in database');
      return;
    }

    console.log(`Found ${data.length} user(s):`);
    data.forEach((user, index) => {
      console.log(`\n  ${index + 1}. ${user.username}`);
      console.log(`     Email: ${user.email || 'N/A'}`);
      console.log(`     Name: ${user.name || 'N/A'}`);
      console.log(`     Created: ${new Date(user.created_at).toLocaleString()}`);
    });
  } catch (error) {
    console.error('❌ Exception:', error.message);
  }
}

async function testLogin(username, password) {
  console.log(`\n🔐 Testing Login: ${username}`);
  try {
    const { data, error } = await supabase
      .from('local_users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !data) {
      console.error('❌ User not found');
      return false;
    }

    const passwordHash = hashPassword(password);
    if (passwordHash !== data.password_hash) {
      console.error('❌ Password incorrect');
      return false;
    }

    console.log('✅ Login successful!');
    return true;
  } catch (error) {
    console.error('❌ Exception:', error.message);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🚀 Chatbot Dashboard - Setup & Test Script');
  console.log('═══════════════════════════════════════════════════════════');

  // Check connection
  const connected = await checkSupabaseConnection();
  if (!connected) {
    console.log('\n❌ Cannot proceed without Supabase connection');
    console.log('Please check your SUPABASE_URL and SUPABASE_KEY');
    process.exit(1);
  }

  // Create demo users
  await createDemoUsers();

  // List all users
  await listAllUsers();

  // Test login
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  🔐 Testing Authentication');
  console.log('═══════════════════════════════════════════════════════════');
  
  await testLogin('admin', 'password123');
  await testLogin('demo', 'demo123456');
  await testLogin('test', 'test123456');
  await testLogin('admin', 'wrongpassword');

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  ✅ Setup Complete!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n📝 Next Steps:');
  console.log('  1. Start dev server: pnpm dev');
  console.log('  2. Go to: http://localhost:3000');
  console.log('  3. Login with: admin / password123');
  console.log('\n🚀 You should now see the dashboard!');
}

main().catch(console.error);
