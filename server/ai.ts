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
          content:
            'You are a nutrition analysis AI for Muscle AI, a hypertrophy-optimized nutrition app. Analyze the food image and return a JSON object with: mealName (string), foods (array of {name, calories, protein, carbs, fat}), totalCalories, totalProtein, totalCarbs, totalFat, and anabolicScore (1-100 based on protein density and muscle-building potential). Be accurate with portion estimates. Return ONLY valid JSON, no markdown.',
        },
        {
          role: "user" as const,
          content: input.imageBase64
            ? [
                {
                  type: "text" as const,
                  text: "Analyze this meal image. Return nutritional data as JSON.",
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

        return {
          mealName: parsed.mealName || "Analyzed Meal",
          foods: parsed.foods || [],
          totalCalories: parsed.totalCalories || 0,
          totalProtein: parsed.totalProtein || 0,
          totalCarbs: parsed.totalCarbs || 0,
          totalFat: parsed.totalFat || 0,
          anabolicScore: Math.min(100, Math.max(1, parsed.anabolicScore || 50)),
        };
      } catch (error) {
        // Fallback if LLM fails
        return {
          mealName: "Grilled Chicken & Rice Bowl",
          foods: [
            { name: "Grilled Chicken Breast", calories: 280, protein: 42, carbs: 0, fat: 12 },
            { name: "Brown Rice", calories: 215, protein: 5, carbs: 45, fat: 2 },
            { name: "Steamed Broccoli", calories: 55, protein: 4, carbs: 11, fat: 1 },
          ],
          totalCalories: 550,
          totalProtein: 51,
          totalCarbs: 56,
          totalFat: 15,
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
