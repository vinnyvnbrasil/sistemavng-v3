const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createUserSettingsTable() {
  try {
    console.log('Creating user_settings table...');
    
    // Create the table
    const { error: tableError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_settings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          email_notifications BOOLEAN DEFAULT true,
          push_notifications BOOLEAN DEFAULT true,
          theme VARCHAR(20) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
          language VARCHAR(10) DEFAULT 'pt-BR',
          timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
          two_factor_enabled BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id)
        );
      `
    });

    if (tableError) {
      console.log('Table might already exist, trying direct query...');
      
      // Try direct query approach
      const { error: directError } = await supabase
        .from('user_settings')
        .select('id')
        .limit(1);
        
      if (directError && directError.code === '42P01') {
        console.log('Table does not exist, creating manually...');
        
        // Since we can't execute DDL directly, let's create a simple test
        console.log('Please run the following SQL in your Supabase dashboard:');
        console.log(`
-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  theme VARCHAR(20) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  language VARCHAR(10) DEFAULT 'pt-BR',
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  two_factor_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON user_settings
  FOR DELETE USING (auth.uid() = user_id);
`);
        
        return;
      } else {
        console.log('Table already exists or accessible!');
      }
    } else {
      console.log('Table created successfully!');
    }

    // Test the table
    console.log('Testing table access...');
    const { data, error: testError } = await supabase
      .from('user_settings')
      .select('*')
      .limit(1);
      
    if (testError) {
      console.error('Error testing table:', testError);
    } else {
      console.log('Table is accessible! Current records:', data?.length || 0);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createUserSettingsTable();