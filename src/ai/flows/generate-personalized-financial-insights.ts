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

const FinancialInsightsInputSchema = z.object({
  income: z.number().describe('The user\'s total income for the month.'),
  expenses: z.number().describe('The user\'s total expenses for the month.'),
  netWorth: z.number().describe('The user\'s current net worth.'),
  transactionHistory: z.string().describe('The user\'s transaction history.'),
});
export type FinancialInsightsInput = z.infer<typeof FinancialInsightsInputSchema>;

const FinancialInsightsOutputSchema = z.object({
  insights: z.string().describe('Personalized financial insights and recommendations.'),
});
export type FinancialInsightsOutput = z.infer<typeof FinancialInsightsOutputSchema>;

export async function generatePersonalizedInsights(input: FinancialInsightsInput): Promise<FinancialInsightsOutput> {
  return generatePersonalizedInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialInsightsPrompt',
  input: {schema: FinancialInsightsInputSchema},
  output: {schema: FinancialInsightsOutputSchema},
  prompt: `You are a personal finance advisor. Analyze the following financial data and provide personalized insights and recommendations to help the user improve their financial habits.

Income: {{income}}
Expenses: {{expenses}}
Net Worth: {{netWorth}}
Transaction History: {{transactionHistory}}

Provide clear, actionable, and concise advice, and identify potential overspending or suggest saving strategies to help improve financial habits.
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
