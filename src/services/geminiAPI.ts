import axios from 'axios';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export interface GeminiAnalysisRequest {
  satelliteData: any;
  analysisType: 'vegetation' | 'water' | 'urban' | 'general';
}

export interface GeminiAnalysisResponse {
  insights: string;
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export async function analyzeWithGemini(request: GeminiAnalysisRequest): Promise<GeminiAnalysisResponse> {
  try {
    const prompt = generatePrompt(request);

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    const generatedText = response.data.candidates[0].content.parts[0].text;
    return parseGeminiResponse(generatedText);
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to analyze data with Gemini AI');
  }
}

function generatePrompt(request: GeminiAnalysisRequest): string {
  const { satelliteData, analysisType } = request;

  const basePrompt = `Analyze the following satellite data for ${analysisType} analysis:

Data: ${JSON.stringify(satelliteData, null, 2)}

Please provide:
1. Key insights about the data (2-3 sentences)
2. Three specific recommendations based on the analysis
3. Overall risk level (low, medium, or high)

Format your response as JSON with the following structure:
{
  "insights": "your insights here",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "riskLevel": "low|medium|high"
}`;

  return basePrompt;
}

function parseGeminiResponse(text: string): GeminiAnalysisResponse {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        insights: parsed.insights || 'No insights available',
        recommendations: parsed.recommendations || [],
        riskLevel: parsed.riskLevel || 'medium'
      };
    }
  } catch (error) {
    console.error('Failed to parse Gemini response:', error);
  }

  return {
    insights: text.substring(0, 200),
    recommendations: ['Continue monitoring', 'Review data quality', 'Schedule follow-up analysis'],
    riskLevel: 'medium'
  };
}

export async function generateSatelliteInsights(satelliteId: string, data: any): Promise<string> {
  try {
    const prompt = `Provide a brief analysis (2-3 sentences) of this satellite data:
    Satellite ID: ${satelliteId}
    Data: ${JSON.stringify(data)}`;

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error generating insights:', error);
    return 'Unable to generate insights at this time.';
  }
}
