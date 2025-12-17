'use server';

/**
 * @fileOverview Generates personalized financial insights and recommendations based on user data.
 *
 * - generatePersonalizedInsights - A function that generates financial insights.
 * - FinancialInsightsInput - The input type for the generatePersonalizedInsights function.
 * - FinancialInsightsOutput - The return type for the generatePersonalizedInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinancialSnapshotSchema = z.object({
    currentMonth: z.object({
      income: z.number(),
      expenses: z.number(),
      netCashFlow: z.number(),
    }),
    previousMonth: z.optional(z.object({
      income: z.number(),
      expenses: z.number(),
      netCashFlow: z.number(),
    })),
    spendingByCategory: z.array(z.object({
      category: z.string(),
      amount: z.number(),
      change: z.optional(z.number()),
    })),
    portfolioAllocation: z.array(z.object({
      assetType: z.string(),
      percentage: z.number(),
      value: z.number(),
    })),
    trends: z.object({
        expenseGrowthStreak: z.number().describe('Number of consecutive months expense has increased'),
    }),
  });

export type FinancialInsightsInput = z.infer<typeof FinancialSnapshotSchema>;

const FinancialInsightsOutputSchema = z.object({
  insights: z
    .array(z.string())
    .describe(
      'A list of 2-3 short, observational, and personalized financial insights based on trigger conditions.'
    ),
});
export type FinancialInsightsOutput = z.infer<typeof FinancialInsightsOutputSchema>;

export async function generatePersonalizedInsights(input: FinancialInsightsInput): Promise<FinancialInsightsOutput> {
  const {output} = await generatePersonalizedInsightsFlow(input);
  return output!;
}

const prompt = ai.definePrompt({
  name: 'financialInsightsPrompt',
  input: {schema: FinancialSnapshotSchema},
  output: {schema: FinancialInsightsOutputSchema},
  system: `You are a financial analytics assistant.
You provide observational insights only.
You do not give financial advice, recommendations, or predictions.
You base all statements strictly on the provided data.
Your tone is neutral and factual.
Generate insights ONLY if a specific condition is met. If no conditions are met, return an empty array for 'insights'.
`,
  prompt: `
Analyze the following financial snapshot and generate insights based ONLY on the specified trigger conditions.

Data:
{{{json this}}}

---

**Trigger Conditions & Output Format:**

1.  **Overspending Detection:**
    *   **Condition:** If any category in \`spendingByCategory\` has a \`change\` greater than or equal to 0.15 (15%).
    *   **Output:** "Spending on '[category]' increased by [change as %] compared to last month."
    *   **Example:** "Spending on 'Food' increased by 18% compared to last month."

2.  **Portfolio Imbalance:**
    *   **Condition:** If any asset in \`portfolioAllocation\` has a \`percentage\` greater than or equal to 0.6 (60%).
    *   **Output:** "[assetType] currently represents [percentage as %] of your portfolio allocation."
    *   **Example:** "Forex currently represents 62% of your portfolio allocation."

3.  **Trend Commentary:**
    *   **Condition:** If \`trends.expenseGrowthStreak\` is greater than or equal to 3.
    *   **Output:** "Total expenses have increased for [expenseGrowthStreak] consecutive months."
    *   **Example:** "Total expenses have increased for 3 consecutive months."

**Instructions:**
- Check each condition.
- For each condition that is met, generate one corresponding insight string.
- If a condition is met for multiple items (e.g., two categories are overspent), you can generate an insight for each, but limit the total number of insights to a maximum of 3.
- If no conditions are met, you MUST return an empty array for the 'insights' field.
- Format percentages to whole numbers (e.g., 0.18 becomes 18%).
- Be concise and stick to the defined output formats.
`,
});

const generatePersonalizedInsightsFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedInsightsFlow',
    inputSchema: FinancialSnapshotSchema,
    outputSchema: FinancialInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
