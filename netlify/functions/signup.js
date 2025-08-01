// Add this to your netlify/functions folder as signup.js

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { email, name, plan, interests, password, location } = JSON.parse(event.body);

    // Validation
    if (!email || !plan || !password) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Parse location if provided
    let city = null, state_region = null, country = 'United States';
    
    if (location && location.trim()) {
      const locationParts = location.split(',').map(part => part.trim());
      
      if (locationParts.length >= 2) {
        city = locationParts[0];
        state_region = locationParts[1];
      } else if (locationParts.length === 1) {
        city = locationParts[0];
      }
    }

    // Initialize Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Email already registered' }),
      };
    }

    // Store user in database
    const { data: newUser, error: dbError } = await supabase
      .from('users')
      .insert([
        {
          email: email,
          name: name || null,
          plan: plan,
          interests: interests || [],
          city: city,
          state_region: state_region,
          country: country
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Failed to create account' }),
      };
    }

    // Store account credentials for login (keep existing localStorage logic on frontend)
    // This just tracks the signup for you

    console.log('New user registered:', newUser);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        success: true,
        message: 'Account created successfully',
        user: {
          email: newUser.email,
          name: newUser.name,
          plan: newUser.plan
        }
      }),
    };

  } catch (error) {
    console.error('Signup error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'Account creation failed. Please try again.' 
      }),
    };
  }
};
