
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rpvltzcxxsjmpfggauhp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwdmx0emN4eHNqbXBmZ2dhdWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NDkxMDcsImV4cCI6MjA4OTAyNTEwN30.XZOn1Slp_ixcg2OcjLDt3tyKRSIe_1DmxxTqe2T46T4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdmin() {
  const email = 'admin@gmail.com';
  const password = 'admin123456';
  const fullName = 'App Admin';

  console.log(`Attempting to create admin account: ${email}...`);

  // 1. Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  });

  if (authError) {
    if (authError.message.toLowerCase().includes('already registered')) {
      console.log('User already exists in Auth.');
      return;
    }
    console.error('Auth Error:', authError.message);
    return;
  }

  const userId = authData.user?.id;
  if (!userId) {
    console.error('Error: No user ID returned');
    return;
  }

  console.log('User created successfully. ID:', userId);

  // 2. Update/Create profile with admin role
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      full_name: fullName,
      role: 'admin'
    });

  if (profileError) {
    console.error('Profile Error:', profileError.message);
    console.log('User ID:', userId);
    console.log('IMPORTANT: Go to Supabase Dashboard -> Table Editor -> profiles');
    console.log(`Find user with ID ${userId} and set role to "admin" manually.`);
  } else {
    console.log('Admin profile created successfully!');
    console.log('-----------------------------------');
    console.log('Email: admin@gmail.com');
    console.log('Password: admin123456');
    console.log('-----------------------------------');
  }
}

createAdmin();
