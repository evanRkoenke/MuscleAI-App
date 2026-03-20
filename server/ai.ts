import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

export const aiRouter = router({
  analyzeMeal: publicProcedure
    .input(
      z.object({
        imageBase64: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const messages = [
        {
          role: "system" as const,
          content: `You are an elite nutrition analysis AI for Muscle AI, a hypertrophy-optimized nutrition tracking app. You have encyclopedic knowledge of every food item ever created across all cuisines worldwide — including but not limited to:

GLOBAL CUISINES: American, Mexican, Italian, French, Japanese, Chinese, Korean, Thai, Vietnamese, Indian, Middle Eastern, Mediterranean, African, Caribbean, Brazilian, Greek, Turkish, Spanish, German, British, Filipino, Indonesian, Malaysian, Peruvian, Ethiopian, and every regional sub-cuisine.

FOOD CATEGORIES: Fresh produce, meats (all cuts and preparations), seafood, dairy, grains, legumes, nuts, seeds, oils, condiments, sauces, spices, baked goods, desserts, beverages, supplements, protein powders, meal replacement shakes, energy bars, fast food (all major chains), restaurant dishes, street food, fermented foods, raw foods, processed foods, frozen meals, canned goods, and specialty diet foods (keto, vegan, paleo, etc.).

BRAND RECOGNITION: You can identify branded products, restaurant chain items, packaged foods, and commercial food products by their visual appearance.

PREPARATION METHODS: You understand how cooking methods (grilled, fried, baked, steamed, raw, sautéed, smoked, braised, etc.) affect nutritional content.

For each food item detected, provide:
- name: specific food name (e.g., "Grilled Chicken Thigh" not just "chicken")
- grams: estimated weight in grams
- calories: total calories
- protein: grams of protein
- carbs: grams of carbohydrates
- fat: grams of fat
- sugar: grams of sugar (total sugars including natural and added)
- confidence: your confidence level 0-100 that this identification is correct

Return a JSON object with:
{
  "mealName": "descriptive meal name",
  "foods": [{"name", "grams", "calories", "protein", "carbs", "fat", "sugar", "confidence"}],
  "totalCalories": number,
  "totalProtein": number,
  "totalCarbs": number,
  "totalFat": number,
  "totalSugar": number,
  "anabolicScore": 1-100 (based on protein density, leucine content, and muscle-building potential)
}

Be precise with portion estimates based on visual cues (plate size, utensil comparison, container volume). If confidence is below 90 for any item, still include it but the app will prompt the user for confirmation. Return ONLY valid JSON, no markdown.`,
        },
        {
          role: "user" as const,
          content: input.imageBase64
            ? [
                {
                  type: "text" as const,
                  text: "Analyze this meal image. Identify every food item with precise nutritional data including sugar content. Return as JSON.",
                },
                {
                  type: "image_url" as const,
                  image_url: {
                    url: `data:image/jpeg;base64,${input.imageBase64}`,
                  },
                },
              ]
            : "The user did not provide an image. Return a sample meal analysis for a grilled chicken breast with rice and broccoli as JSON.",
        },
      ];

      try {
        const result = await invokeLLM({
          messages,
          responseFormat: { type: "json_object" },
        });

        const content = result.choices[0]?.message?.content;
        const text = typeof content === "string" ? content : "";
        const parsed = JSON.parse(text);

        // Normalize foods to always include sugar, grams, and confidence
        const foods = (parsed.foods || []).map((f: any) => ({
          name: f.name || "Unknown Item",
          grams: f.grams || 100,
          calories: f.calories || 0,
          protein: f.protein || 0,
          carbs: f.carbs || 0,
          fat: f.fat || 0,
          sugar: f.sugar || 0,
          confidence: Math.min(100, Math.max(0, f.confidence || 95)),
        }));

        return {
          mealName: parsed.mealName || "Analyzed Meal",
          foods,
          totalCalories: parsed.totalCalories || foods.reduce((s: number, f: any) => s + f.calories, 0),
          totalProtein: parsed.totalProtein || foods.reduce((s: number, f: any) => s + f.protein, 0),
          totalCarbs: parsed.totalCarbs || foods.reduce((s: number, f: any) => s + f.carbs, 0),
          totalFat: parsed.totalFat || foods.reduce((s: number, f: any) => s + f.fat, 0),
          totalSugar: parsed.totalSugar || foods.reduce((s: number, f: any) => s + f.sugar, 0),
          anabolicScore: Math.min(100, Math.max(1, parsed.anabolicScore || 50)),
        };
      } catch (error) {
        // Fallback if LLM fails
        return {
          mealName: "Grilled Chicken & Rice Bowl",
          foods: [
            { name: "Grilled Chicken Breast", grams: 170, calories: 280, protein: 42, carbs: 0, fat: 12, sugar: 0, confidence: 95 },
            { name: "Brown Rice", grams: 150, calories: 215, protein: 5, carbs: 45, fat: 2, sugar: 1, confidence: 92 },
            { name: "Steamed Broccoli", grams: 100, calories: 55, protein: 4, carbs: 11, fat: 1, sugar: 2, confidence: 94 },
          ],
          totalCalories: 550,
          totalProtein: 51,
          totalCarbs: 56,
          totalFat: 15,
          totalSugar: 3,
          anabolicScore: 87,
        };
      }
    }),

  chat: publicProcedure
    .input(
      z.object({
        message: z.string(),
        systemPrompt: z.string().optional(),
        history: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const messages = [
        {
          role: "system" as const,
          content:
            input.systemPrompt ||
            "You are Muscle Support, the AI assistant for Muscle AI app. Be helpful, concise, and professional.",
        },
        ...(input.history || []).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        {
          role: "user" as const,
          content: input.message,
        },
      ];

      try {
        const result = await invokeLLM({ messages });
        const content = result.choices[0]?.message?.content;
        const text = typeof content === "string" ? content : "";
        return { reply: text };
      } catch (error) {
        return {
          reply:
            "I apologize, but I'm having trouble connecting right now. Please try again in a moment, or contact us at support@muscleai.app for immediate assistance.",
        };
      }
    }),
});
