const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function analyzeNotesWithAI(textContent, apiKey) {
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Please add it in Settings.');
  }

  const prompt = `You are a study planner AI. Analyze the following study notes and extract a structured study plan.

Return ONLY a valid JSON object (no markdown, no code fences) with this exact structure:
{
  "examName": "suggested exam/subject name based on the content",
  "topics": [
    {
      "name": "Topic name",
      "estimatedMinutes": 30,
      "youtubeQuery": "search query for YouTube",
      "articleQuery": "search query for articles"
    }
  ],
  "totalEstimatedHours": 5,
  "summary": "Brief 1-2 sentence summary of what the notes cover"
}

Rules:
- Extract 3-15 meaningful subtopics from the notes
- Estimate realistic study time in minutes for each topic
- YouTube queries should be specific and educational
- Article queries should target learning resources
- If the notes are too short or unclear, still try your best to extract topics

NOTES CONTENT:
${textContent.substring(0, 30000)}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
      }
    })
  });

  if (!response.ok) {
    const err = await response.json();
    if (response.status === 400 || response.status === 403) {
      throw new Error('Invalid API key or quota exceeded. Check your Gemini API key.');
    }
    throw new Error(err.error?.message || 'AI analysis failed');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response from AI. Please try again.');
  }

  // Parse JSON from response (handle potential markdown wrapping)
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse AI response:', cleaned);
    throw new Error('AI returned an unexpected format. Please try again.');
  }
}

export function getYouTubeSearchUrl(query) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export function getArticleSearchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query + ' tutorial guide')}`;
}
