import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nlqeexipesmiefqipeqg.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5scWVleGlwZXNtaWVmcWlwZXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMTIyNzMsImV4cCI6MjA3NDg4ODI3M30.mwGW3Q3GqQC4BKu7F17X_khH8KOiIZ6lwU_e45Pe4co';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function createDemoUser() {
  try {
    console.log('Creating demo user...');
    
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
        console.error(`Error creating user ${user.username}:`, error.message);
      } else {
        console.log(`✅ Created user: ${user.username}`);
        console.log(`   Password: ${user.password}`);
        console.log(`   Email: ${user.email}`);
      }
    }

    console.log('\n✅ Demo users created successfully!');
    console.log('\nYou can now login with:');
    console.log('Username: admin');
    console.log('Password: password123');
    console.log('\nOr:');
    console.log('Username: demo');
    console.log('Password: demo123456');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createDemoUser();
