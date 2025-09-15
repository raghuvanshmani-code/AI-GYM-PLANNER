import { GoogleGenAI, Type } from "@google/genai";
import type { UserData } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const dietPlanSchema = {
  type: Type.OBJECT,
  properties: {
    disclaimer: { type: Type.STRING, nullable: true, description: "A disclaimer to consult a medical practitioner, especially if medical conditions are listed." },
    weeklyPlan: {
      type: Type.ARRAY,
      description: "An array of 7 daily meal plans.",
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING },
          meals: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "e.g., Breakfast, Lunch, Dinner, Snack" },
                time: { type: Type.STRING, description: "e.g., 8:00 AM" },
                description: { type: Type.STRING, description: "A brief description of the meal." },
                macros: {
                  type: Type.OBJECT,
                  properties: {
                    calories: { type: Type.NUMBER },
                    protein: { type: Type.NUMBER },
                    carbs: { type: Type.NUMBER },
                    fat: { type: Type.NUMBER },
                  },
                  required: ["calories", "protein", "carbs", "fat"],
                },
                recipe: {
                  type: Type.OBJECT,
                  properties: {
                    prepTime: { type: Type.STRING },
                    cookTime: { type: Type.STRING },
                    servings: { type: Type.NUMBER },
                    steps: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ["prepTime", "cookTime", "servings", "steps"],
                },
                imageSearchTerm: { type: Type.STRING, description: "A simple, descriptive search term for a stock photo of the meal (e.g., 'bowl of oatmeal with berries')." },
                ingredientSubstitutions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      original: { type: Type.STRING },
                      suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ["original", "suggestions"],
                  },
                },
              },
              required: ["name", "time", "description", "macros", "recipe", "imageSearchTerm", "ingredientSubstitutions"],
            },
          },
          dailyTotals: {
            type: Type.OBJECT,
            properties: {
              calories: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fat: { type: Type.NUMBER },
            },
            required: ["calories", "protein", "carbs", "fat"],
          },
          estimatedCost: { type: Type.NUMBER },
        },
        required: ["day", "meals", "dailyTotals", "estimatedCost"],
      },
    },
    weeklyAverages: {
      type: Type.OBJECT,
      properties: {
        macros: {
          type: Type.OBJECT,
          properties: {
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
          },
          required: ["calories", "protein", "carbs", "fat"],
        },
        estimatedCost: { type: Type.NUMBER },
      },
      required: ["macros", "estimatedCost"],
    },
    currency: { type: Type.STRING, description: "The currency code used for cost estimates, e.g., USD, INR." },
  },
  required: ["weeklyPlan", "weeklyAverages", "currency"],
};


const buildPrompt = (data: UserData): string => {
  return `
You are a professional registered-dietitian-level assistant with product-minded behavior. Produce a medically sensible, culturally and regionally-aware weekly diet plan tailored to the user's inputs.

User Profile:
- Age: ${data.age}
- Gender: ${data.gender}
- Weight: ${data.weight} kg
- Height: ${data.height} cm
- Activity Level: ${data.activityLevel.replace('_', ' ')}
- Goal: ${data.goal.replace('_', ' ')}
- Location/Region: ${data.region}
- Budget Tier: ${data.budget}
- Currency for Cost Estimates: ${data.currency}

Constraints & Preferences:
- Allergies: ${data.allergies || 'None specified'}
- Dietary Preferences (religious/ethical): ${data.preferences || 'None specified'}
- Medical Conditions: ${data.medicalConditions || 'None specified'}

Your Task:
1.  Generate a complete 7-day diet plan.
2.  The output must be a single, strictly valid JSON object that conforms to the provided schema. Do not add any extra commentary, explanations, or markdown formatting like \`\`\`json around the JSON object itself.
3.  After the JSON object, add a single newline, and then provide a 2-4 sentence friendly, practical, and encouraging human-readable summary of the plan.

Key Directives:
- Respect all allergies, religious/ethical preferences, and medical conditions.
- If medical conditions (e.g., diabetes, hypertension, CKD) are mentioned, YOU MUST include a clear "disclaimer" in the JSON directing the user to consult a medical practitioner and generate a conservative plan that does not risk health.
- Use local ingredient names appropriate for the user's region (e.g., for India: "roti", "idli", "poha", "daal"). If an ingredient is not common, suggest a widely-available substitute.
- Ingredient choices and portioning must be consistent with the specified budget tier.
- Provide macronutrient (calories, protein, carbs, fat) totals for each meal and each day, plus a weekly average.
- For each meal, provide an \`imageSearchTerm\`. This should be a simple, descriptive phrase suitable for an image search API to find a relevant photo of the dish. For example: "grilled chicken salad with avocado" or "bowl of lentil soup".
- Provide approximate cost estimates per day and for the week in the specified local currency. Mark these as estimates.
- Recipes must have simple steps (3-8), prep time, cook time, and estimated servings.
- For each major ingredient in a meal, provide 2-3 substitution suggestions for affordability and availability.
- Ensure all JSON keys and data types follow the schema exactly.
`;
};


export const generateDietPlan = async (data: UserData): Promise<string> => {
  const prompt = buildPrompt(data);
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
        responseMimeType: "application/json",
        responseSchema: dietPlanSchema
    }
  });

  return response.text;
};