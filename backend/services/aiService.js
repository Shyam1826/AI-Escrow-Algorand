const OpenAI = require('openai');

if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not set. AI contract generation will use fallback.');
}

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  : null;

/**
 * Generate a structured freelance contract using OpenAI.
 * Falls back to a simple contract shape if parsing fails.
 */
async function generateContract(description, budget, deadline) {
  const prompt = `
Generate a freelance work contract for the following job.

Job description: ${description}
Budget: ${budget}
Deadline: ${deadline}

Return a concise JSON contract with fields:
job, scope, payment, deadline, terms.

Only return valid JSON, with no extra text.`;

  try {
    if (!client) {
      throw new Error('OpenAI client not initialized');
    }

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4
    });

    const raw = response.choices?.[0]?.message?.content?.trim() || '';
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // If the model wrapped JSON in markdown, try to extract the block.
      const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (match) {
        parsed = JSON.parse(match[1]);
      } else {
        throw new Error('Failed to parse AI contract JSON');
      }
    }

    return parsed;
  } catch (error) {
    console.error('OpenAI contract generation failed, using fallback:', error.message);
    // Fallback simple contract so app continues to work.
    return {
      job: description,
      scope: `Deliver the work described in the job description within the agreed budget and deadline.`,
      payment: budget,
      deadline,
      terms:
        'Client releases payment from escrow after accepting the delivered work. Revisions and dispute resolution are handled in good faith by both parties.'
    };
  }
}

/**
 * Given a list of negotiation messages, ask OpenAI for a fair price suggestion.
 */
async function generatePriceSuggestion(messages) {
  const conversationText = messages
    .map((m) => `${m.sender}: ${m.message}`)
    .join('\n');

  const prompt = `Based on the following negotiation conversation between a client and freelancer, suggest a fair project price in ALGO.

Conversation:
${conversationText}

Return JSON:
{
  "suggestedPrice": number,
  "explanation": string
}

Only return valid JSON, with no extra text.`;

  if (!client) {
    throw new Error('OpenAI client not initialized');
  }

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4
  });

  const raw = response.choices?.[0]?.message?.content?.trim() || '';

  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (match) {
      return JSON.parse(match[1]);
    }
    throw new Error('Failed to parse AI price suggestion JSON');
  }
}

module.exports = {
  generateContract,
  generatePriceSuggestion
};

