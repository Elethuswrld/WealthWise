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

const TransactionSchema = z.object({
  type: z.enum(['income', 'expense', 'investment']),
  category: z.string(),
  amount: z.number(),
  date: z.string().describe('Date in ISO format'),
});

const AssetSchema = z.object({
    assetType: z.string(),
    currentValue: z.number(),
});

const FinancialInsightsInputSchema = z.object({
  transactions: z.array(TransactionSchema).describe("The user's transaction history for the last 2-3 months."),
  portfolio: z.array(AssetSchema).describe("The user's current investment portfolio."),
});
export type FinancialInsightsInput = z.infer<typeof FinancialInsightsInputSchema>;

const FinancialInsightsOutputSchema = z.object({
  insights: z
    .array(z.string())
    .describe(
      'A list of 2-3 short, observational, and personalized financial insights. Frame insights as statements, not advice.'
    ),
});
export type FinancialInsightsOutput = z.infer<typeof FinancialInsightsOutputSchema>;

export async function generatePersonalizedInsights(input: FinancialInsightsInput): Promise<FinancialInsightsOutput> {
  const {output} = await generatePersonalizedInsightsFlow(input);
  return output!;
}

const prompt = ai.definePrompt({
  name: 'financialInsightsPrompt',
  input: {schema: FinancialInsightsInputSchema},
  output: {schema: FinancialInsightsOutputSchema},
  prompt: `You are a financial analyst. Your role is to provide observational insights based on the provided financial data. Do not give advice or instructions.

Analyze the following data:
- Transaction History: A JSON array of recent transactions.
- Portfolio: A JSON array of the user's current assets.

Based on this data, identify 2-3 key patterns, trends, or potential imbalances.

Examples of good, observational insights:
- "Your spending on 'Dining Out' has increased by 25% compared to the previous month."
- "Your portfolio has a 70% allocation to Cryptocurrency."
- "Your income has been consistent for the past three months."
- "Your 'Subscription' expenses make up 15% of your monthly spending."

Examples of bad, advisory insights (DO NOT DO THIS):
- "You should spend less on 'Dining Out'."
- "You must rebalance your portfolio."
- "You need to find a new job."

Here is the user's data:

Transactions:
{{{json transactions}}}

Portfolio:
{{{json portfolio}}}

Generate your insights based *only* on the data provided.
`,
});

const generatePersonalizedInsightsFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedInsightsFlow',
    inputSchema: FinancialInsightsInputSchema,
    outputSchema: FinancialInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
