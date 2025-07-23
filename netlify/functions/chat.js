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

  const systemPrompt = `You are a local activity search assistant. Your job is to help users find activities, places, and events in their area by searching current information on the internet.

SEARCH CAPABILITIES:
- You can search for real businesses, restaurants, events, and activities
- You can find current information like hours, locations, and contact details
- You can suggest specific places with addresses and details
- You can search for events happening now or in the near future
- You excel at neighborhood-level searches (e.g., "Capitol Hill area", "SoHo district")

LOCATION CONTEXT: ${location}

SEARCH APPROACH:
1. Use current internet search to find relevant local activities in the specified area
2. Be as specific as possible - if they ask for "Capitol Hill area", focus on that neighborhood
3. Provide specific business names, addresses, and basic details
4. Include variety in your suggestions (different price points, activity types)
5. Focus on highly-rated and recently active businesses
6. Include practical details like approximate costs, phone numbers when available
7. Mention specific cross streets or landmarks for better directions

EXAMPLE SEARCHES YOU CAN HANDLE:
- "Painting studios in Seattle Capitol Hill area"
- "Good coffee shops in Brooklyn Williamsburg"
- "Hiking trails near Golden Gate Park"
- "Live music venues in Austin downtown"
- "Art galleries in Chelsea district"

FORMAT YOUR RESPONSE:
- Start with acknowledging their specific request and location
- Provide 3-5 specific suggestions with detailed information:
  * Business name and type
  * Address with cross streets when helpful
  * Brief description of what makes it special
  * Hours or contact info when available
  * Approximate price range if relevant
- End with the verification disclaimer
- Use a conversational, helpful tone

IMPORTANT DISCLAIMERS YOU MUST INCLUDE:
⚠️ Always remind users to verify business hours, locations, and availability before visiting
⚠️ Mention that information may have changed since your last search
⚠️ Suggest calling ahead or checking websites for the most current details
⚠️ Note that you cannot guarantee accuracy of third-party business information

Remember: Search for current, real information rather than making generic suggestions. Be as specific and helpful as possible!

${userContext ? '\n' + userContext : ''}`;

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
          ...conversationHistory.slice(-3), // Less history for focused search
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('Activity search API error');
    }

    const data = await response.json();
    let aiResponse = data.choices[0].message.content;

    // Add verification disclaimer if not already included
    if (!aiResponse.toLowerCase().includes('verify') && !aiResponse.toLowerCase().includes('check')) {
      aiResponse += '\n\n⚠️ **Important:** Please verify business hours, locations, and availability before visiting. Information may have changed, so I recommend calling ahead or checking their websites for the most current details!';
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        response: aiResponse + " 🔍", // Indicator for activity search
        model: "activity-search"
      }),
    };

  } catch (error) {
    console.error('Activity search error:', error);
    // Fallback to regular OpenAI if search fails
    return await handleOpenAI(message, conversationHistory, userContext);
  }
}

// CLAUDE OPUS HANDLER
async function handleClaudeOpus(message, conversationHistory, userContext) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Claude Opus not configured' }),
    };
  }

  const systemPrompt = `You are someone's AI friend through Kinly - a thoughtful companion for deeper conversations. You excel at:

- Providing thoughtful advice and perspective on complex situations
- Helping people work through difficult decisions or emotions
- Having meaningful conversations about life, relationships, and personal growth
- Being a supportive listener for serious topics

Your approach:
- Take time to really understand what they're going through
- Ask thoughtful follow-up questions to help them think things through
- Offer perspective without being preachy or clinical
- Remember you're a friend, not a therapist - be warm and genuine
- Help them find their own answers rather than telling them what to do

${userContext ? '\n' + userContext : ''}`;

  // Format conversation for Claude API
  const messages = [];
  
  // Add conversation history
  conversationHistory.slice(-8).forEach(msg => {
    if (msg.role === 'user') {
      messages.push({ role: 'human', content: msg.content });
    } else if (msg.role === 'assistant') {
      messages.push({ role: 'assistant', content: msg.content });
    }
  });
  
  // Add current message
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
      const errorText = await response.text();
      console.error('Claude Opus Error:', response.status, errorText);
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
        response: aiResponse + " 🧠", // Indicator it's from Claude Opus
        model: "claude-opus"
      }),
    };

  } catch (error) {
    console.error('Claude Opus error:', error);
    // Fallback to OpenAI if Claude fails
    console.log('Falling back to OpenAI...');
    return await handleOpenAI(message, conversationHistory, userContext);
  }
}

// OPENAI HANDLER
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

  const systemPrompt = `You are someone's AI friend through Kinly - perfect for quick, casual conversations and activity suggestions. You excel at:

- Light, fun conversations and small talk
- Activity suggestions and getting people outside
- Quick encouragement and motivation
- Casual humor and friendly banter
- Simple questions and everyday chat

Keep responses brief, upbeat, and focused on the moment. You're great for when someone just wants to chat or needs a quick suggestion!

${userContext ? '\n' + userContext : ''}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-6), // Less history for casual chat
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
        max_tokens: 200, // Shorter responses for casual chat
        temperature: 0.9, // More creative for fun conversations
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
        response: aiResponse + " ⚡", // Indicator it's from OpenAI
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
