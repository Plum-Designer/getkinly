exports.handler = async (event, context) => {
  // Handle CORS preflight
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

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { message, conversationHistory = [], userContext = null } = JSON.parse(event.body);

    if (!message) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Message is required' }),
      };
    }

    // SMART ROUTING: Decide which AI/search to use based on message content
    const result = await routeMessage(message, conversationHistory, userContext);
    return result;

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'An unexpected error occurred. Please try again.' 
      }),
    };
  }
};

// MAIN ROUTING LOGIC
async function routeMessage(message, conversationHistory, userContext) {
  // Check for activity search first
  if (shouldUseActivitySearch(message, conversationHistory)) {
    console.log('Routing to Activity Search');
    return await handleActivitySearch(message, conversationHistory, userContext);
  }
  
  // Then check for deep conversation vs casual chat
  const useClaudeOpus = shouldUseClaudeOpus(message, conversationHistory);
  
  if (useClaudeOpus) {
    console.log('Routing to Claude Opus for deep conversation');
    return await handleClaudeOpus(message, conversationHistory, userContext);
  } else {
    console.log('Routing to OpenAI for quick/casual chat');
    return await handleOpenAI(message, conversationHistory, userContext);
  }
}

// ACTIVITY SEARCH DETECTION
function shouldUseActivitySearch(message, conversationHistory) {
  const msg = message.toLowerCase();
  
  // Enhanced trigger phrases for activity search
  const activityTriggers = [
    // Direct search terms
    'find', 'look for', 'search for', 'where can i', 'what to do', 'are there any',
    'know of any', 'recommend', 'suggestion', 'suggestions',
    
    // Activity types
    'activities', 'restaurants', 'things to do', 'places to go', 'spots',
    'coffee shops', 'cafes', 'hiking', 'museums', 'parks', 'bars', 'events',
    'entertainment', 'fun', 'date ideas', 'weekend plans', 'tonight',
    'galleries', 'studios', 'classes', 'workshops', 'gyms', 'fitness',
    'bookstores', 'shops', 'markets', 'food', 'brunch', 'dinner',
    
    // Location indicators
    'near me', 'in my area', 'local', 'around here', 'nearby',
    'in the', 'area', 'neighborhood', 'district'
  ];
  
  // Check if user is asking for local activities
  const hasActivityTrigger = activityTriggers.some(trigger => msg.includes(trigger));
  
  // Enhanced location detection
  const locationIndicators = [
    'in ', 'near ', 'around ', 'at ', 'area', 'neighborhood', 
    'district', 'downtown', 'uptown', 'hill', 'heights', 'village'
  ];
  
  const hasLocationContext = locationIndicators.some(indicator => msg.includes(indicator)) ||
                            conversationHistory.some(msg => 
                              msg.content && msg.content.toLowerCase().includes('live in'));
  
  return hasActivityTrigger && (hasLocationContext || msg.includes('near me'));
}

// CLAUDE OPUS DETECTION
function shouldUseClaudeOpus(message, conversationHistory) {
  const msg = message.toLowerCase();
  
  // Use Claude Opus for deep/complex conversations
  const deepTopics = [
    'advice', 'help me decide', 'what should i do', 'struggling with',
    'relationship', 'career', 'life', 'meaning', 'purpose', 'philosophy',
    'depression', 'anxiety', 'stress', 'mental health', 'therapy',
    'complicated', 'complex', 'difficult situation', 'serious',
    'existential', 'deep', 'meaning of', 'why do', 'how do i cope',
    'feeling lost', 'confused', 'overwhelmed', 'big decision'
  ];
  
  // Use Claude Opus for longer messages (likely more thoughtful)
  if (message.length > 200) return true;
  
  // Use Claude Opus if conversation is getting deep
  if (conversationHistory.length > 6) return true;
  
  // Check for deep topic keywords
  return deepTopics.some(topic => msg.includes(topic));
}

// ACTIVITY SEARCH HANDLER
async function handleActivitySearch(message, conversationHistory, userContext) {
  if (!process.env.OPENAI_API_KEY) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Search service not configured' }),
    };
  }

  // Extract location from message or context
  const location = extractLocationFromMessage(message) || 
                  extractLocationFromContext(userContext) || 
                  'local area';

  const systemPrompt = `You are Kinly, an AI friend who specializes in finding local activities and getting people outside! Your mission is to help users discover amazing real-world experiences in their area.

KINLY'S PERSONALITY IN SEARCH MODE:
- Enthusiastic about local discoveries and getting people offline
- Makes light jokes about spending too much time inside
- Celebrates when users want to explore their community
- Encourages trying new things with gentle humor
- Gets excited about helping people find their next adventure

SEARCH CAPABILITIES:
- You can search for real businesses, restaurants, events, and activities
- You can find current information like hours, locations, and contact details
- You can suggest specific places with addresses and details
- You can search for events happening now or in the near future
- You excel at neighborhood-level searches

LOCATION CONTEXT: ${location}

KINLY'S SEARCH APPROACH:
1. Start with enthusiasm about getting them outside: "Ooh, I love this! Let me find you some awesome spots..."
2. Use current internet search to find 3-5 specific suggestions
3. Add personality: "This place looks amazing!" or "I've heard great things about..."
4. Include practical details with enthusiasm: "They're open until 9pm - perfect for tonight!"
5. End with encouragement: "Pick one and go check it out! You've got this!"
6. Always include the verification disclaimer

KINLY'S TONE:
- Excited and encouraging about local adventures
- Uses phrases like "You're gonna love this!" or "This is right up your alley!"
- Gentle humor about getting offline: "Way better than scrolling, right?"
- Celebratory about their decision to explore: "I'm so proud you're getting out there!"

${userContext ? '\n' + userContext : ''}

IMPORTANT: Always include verification disclaimer about checking hours/details before visiting.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.slice(-3),
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.8, // More personality and enthusiasm
      }),
    });

    if (!response.ok) {
      throw new Error('Activity search API error');
    }

    const data = await response.json();
    let aiResponse = data.choices[0].message.content;

    // Add verification disclaimer if not already included
    if (!aiResponse.toLowerCase().includes('verify') && !aiResponse.toLowerCase().includes('check')) {
      aiResponse += '\n\n⚠️ **Quick reminder:** Double-check hours and details before heading out - things change sometimes! 📍';
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        response: aiResponse,
        model: "activity-search"
      }),
    };

  } catch (error) {
    console.error('Activity search error:', error);
    return await handleOpenAI(message, conversationHistory, userContext);
  }
}

// CLAUDE OPUS HANDLER - For Deep Conversations
async function handleClaudeOpus(message, conversationHistory, userContext) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return await handleOpenAI(message, conversationHistory, userContext);
  }

  const systemPrompt = `You are Kinly, an AI friend who excels at deeper conversations while staying true to your core mission: getting people offline and into real-world adventures.

KINLY'S APPROACH TO DEEP CONVERSATIONS:
- You're a supportive friend, not a therapist
- You listen thoughtfully and ask good follow-up questions
- You gently connect problems back to real-world solutions when appropriate
- You use humor to lighten heavy moments without dismissing feelings
- You encourage taking action in the real world as part of healing/growth
- You help people see how community connection can help with their challenges

CORE PERSONALITY:
- Gets to know users deeply (interests, goals, fears, dreams)
- Makes them laugh and calls out overthinking with gentle humor
- Pushes toward real-world adventures as solutions to problems
- Examples: "Sounds like you need to get out of your head and into some fresh air!"

YOUR UNIQUE APPROACH:
- For anxiety: Suggest gentle real-world exposure (coffee shops, walks)
- For loneliness: Encourage community activities and local connections
- For big decisions: Recommend taking a walk to think or discussing with real people
- For overwhelm: Suggest grounding activities like hiking or hands-on classes

Remember: You believe real-world experiences and community connections are powerful medicine for most of life's challenges.

${userContext ? '\n' + userContext : ''}`;

  const messages = [];
  
  conversationHistory.slice(-8).forEach(msg => {
    if (msg.role === 'user') {
      messages.push({ role: 'human', content: msg.content });
    } else if (msg.role === 'assistant') {
      messages.push({ role: 'assistant', content: msg.content });
    }
  });
  
  messages.push({ role: 'human', content: message });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 400,
        system: systemPrompt,
        messages: messages
      }),
    });

    if (!response.ok) {
      console.error('Claude Opus Error:', response.status);
      throw new Error('Claude Opus API error');
    }

    const data = await response.json();
    const aiResponse = data.content[0].text;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        response: aiResponse,
        model: "claude-opus"
      }),
    };

  } catch (error) {
    console.error('Claude Opus error:', error);
    return await handleOpenAI(message, conversationHistory, userContext);
  }
}

// OPENAI HANDLER - For Casual Chat
async function handleOpenAI(message, conversationHistory, userContext) {
  if (!process.env.OPENAI_API_KEY) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'OpenAI not configured' }),
    };
  }

  const systemPrompt = `You are Kinly, an AI friend whose mission is crystal clear: get people offline and into real-world adventures while being the most supportive, funny friend they've ever had.

KINLY'S CORE IDENTITY:
🎯 Mission: Get people offline and into their communities
😄 Personality: Humorous, supportive, gently pushes toward action
🌍 Focus: Real-world adventures and local community connection

YOUR UNIQUE TRAITS:
- Gets to know users deeply (remembers details, asks follow-ups)
- Makes them laugh with gentle teasing and calling out overthinking
- Constantly but naturally steers conversations toward real-world activities
- Celebrates when people take action in the real world
- Uses humor to help people get out of their own way

CONVERSATION STYLE:
- Use their name naturally and warmly
- Ask questions that learn about their interests and goals
- Gently tease overthinking: "You're thinking too much again, aren't you?"
- Suggest offline activities casually: "Sounds like coffee shop conversation material!"
- Celebrate small wins: "That's awesome! See what happens when you get outside?"
- Be encouraging about trying new things

EXAMPLES OF YOUR PERSONALITY:
- User worried about something: "Okay, but have you tried talking this through on a walk? Fresh air = fresh perspective!"
- User says they're bored: "Boredom is just your brain begging for adventure! What's calling to you?"
- User overthinking: "I can practically hear the gears turning from here! Want to get out of your head for a bit?"

ALWAYS REMEMBER: You're not just chatting - you're strategically encouraging real-world engagement and community connection.

${userContext ? '\n' + userContext : ''}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-6),
    { role: 'user', content: message }
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 250, // Slightly longer for personality
        temperature: 0.85, // High creativity for humor and personality
        presence_penalty: 0.6, // Encourage varied responses
        frequency_penalty: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Error:', response.status, errorText);
      throw new Error('OpenAI API error');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        response: aiResponse,
        model: "openai"
      }),
    };

  } catch (error) {
    console.error('OpenAI error:', error);
    throw error;
  }
}

// HELPER FUNCTIONS
function extractLocationFromMessage(message) {
  const msg = message.toLowerCase();
  
  // Look for specific neighborhood/area patterns
  const specificPatterns = [
    /in ([a-zA-Z\s]+?) area/,           // "in Capitol Hill area"
    /in ([a-zA-Z\s]+?) neighborhood/,  // "in SoHo neighborhood" 
    /in ([a-zA-Z\s]+?) district/,      // "in Arts District"
    /in downtown ([a-zA-Z\s]+)/,       // "in downtown Seattle"
    /in ([a-zA-Z\s]+?),?\s+([a-zA-Z\s]+)/,  // "in Capitol Hill, Seattle"
    /near ([a-zA-Z\s]+?) area/,        // "near Capitol Hill area"
    /around ([a-zA-Z\s]+?) area/       // "around Capitol Hill area"
  ];
  
  // Try specific patterns first for neighborhood-level precision
  for (const pattern of specificPatterns) {
    const match = msg.match(pattern);
    if (match) {
      // For patterns with two groups, combine them
      if (match[2]) {
        return `${match[1].trim()}, ${match[2].trim()}`;
      }
      return match[1].trim();
    }
  }
  
  // Fall back to general patterns
  const generalPatterns = [
    /in ([a-zA-Z\s]+?)(?:\s|$|,|\.|!|\?)/,
    /near ([a-zA-Z\s]+?)(?:\s|$|,|\.|!|\?)/
  ];
  
  for (const pattern of generalPatterns) {
    const match = msg.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return null;
}

function extractLocationFromContext(userContext) {
  if (!userContext) return null;
  
  const locationMatch = userContext.match(/Lives in: ([^\n]+)/);
  return locationMatch ? locationMatch[1] : null;
}
