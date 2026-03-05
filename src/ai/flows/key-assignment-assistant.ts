'use server';
/**
 * @fileOverview A Genkit flow that acts as a Smart Assignment Tool.
 *
 * - keyAssignmentAssistant - A function that provides optimal key assignments or flags potential conflicts.
 * - KeyAssignmentAssistantInput - The input type for the keyAssignmentAssistant function.
 * - KeyAssignmentAssistantOutput - The return type for the keyAssignmentAssistant function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const KeyAssignmentAssistantInputSchema = z.object({
  desiredKeyPurpose: z.string().describe('The specific purpose or type of key the administrator is looking to assign (e.g., "main entrance", "server room", "vehicle key for department A").'),
  assigneeId: z.string().describe('The ID of the individual to whom the key is intended to be assigned.'),
  currentAvailability: z.array(z.object({
    keyId: z.string().describe('Unique identifier for the key.'),
    status: z.enum(['available', 'checked_out', 'overdue']).describe('Current status of the key.'),
    location: z.string().describe('Physical location where the key is stored or its last known location.'),
    type: z.string().describe('The type or purpose of the key (e.g., "office", "server room", "vehicle").'),
    currentAssigneeId: z.string().optional().describe('The ID of the individual who currently has the key, if checked out.'),
  })).describe('An array detailing the current status and location of all physical keys in the inventory.'),
  historicalUsage: z.array(z.object({
    keyId: z.string().describe('Unique identifier for the key involved in the transaction.'),
    assigneeId: z.string().describe('The ID of the individual who checked out the key.'),
    checkoutDate: z.string().datetime().describe('Timestamp when the key was checked out.'),
    returnDate: z.string().datetime().nullable().describe('Timestamp when the key was returned, or null if still checked out.'),
    durationHours: z.number().optional().describe('How long the key was held, in hours.'),
    lateReturn: z.boolean().optional().describe('True if the key was returned late.'),
  })).describe('A log of past key transactions, including who checked out which key and when.'),
});
export type KeyAssignmentAssistantInput = z.infer<typeof KeyAssignmentAssistantInputSchema>;

const KeyAssignmentAssistantOutputSchema = z.object({
  suggestions: z.array(z.object({
    keyId: z.string().describe('The ID of a suggested key.'),
    reason: z.string().describe('Why this key is suggested (e.g., "available and matches purpose", "least used historicaly").'),
  })).describe('A list of optimal key assignments based on the analysis.'),
  conflicts: z.array(z.object({
    keyId: z.string().optional().describe('The ID of the key related to the conflict, if applicable.'),
    assigneeId: z.string().optional().describe('The ID of the assignee related to the conflict, if applicable.'),
    description: z.string().describe('A detailed explanation of the potential conflict (e.g., "Key already checked out", "Assignee has a history of late returns for similar keys").'),
    severity: z.enum(['low', 'medium', 'high']).describe('The severity of the conflict.'),
  })).describe('A list of potential conflicts flagged by the system.'),
  overallAnalysis: z.string().describe('A summary of the AI\'s findings and recommendations.'),
});
export type KeyAssignmentAssistantOutput = z.infer<typeof KeyAssignmentAssistantOutputSchema>;

export async function keyAssignmentAssistant(input: KeyAssignmentAssistantInput): Promise<KeyAssignmentAssistantOutput> {
  return keyAssignmentAssistantFlow(input);
}

const keyAssignmentAssistantPrompt = ai.definePrompt({
  name: 'keyAssignmentAssistantPrompt',
  input: { schema: KeyAssignmentAssistantInputSchema },
  output: { schema: KeyAssignmentAssistantOutputSchema },
  prompt: `You are an intelligent key assignment assistant. Your goal is to help administrators make efficient and error-free key assignments.\nYou will analyze the current key availability and historical usage patterns to suggest optimal keys for a given purpose and assignee, and identify any potential conflicts.\n\nHere is the information you need to analyze:\n\nDesired Key Purpose: {{{desiredKeyPurpose}}}\nAssignee ID: {{{assigneeId}}}\n\nCurrent Key Availability:\n{{#each currentAvailability}}\n- Key ID: {{keyId}}, Status: {{status}}, Location: {{location}}, Type: {{type}}{{#if currentAssigneeId}}, Currently held by: {{currentAssigneeId}}{{/if}}\n{{/each}}\n\nHistorical Key Usage:\n{{#each historicalUsage}}\n- Key ID: {{keyId}}, Assignee: {{assigneeId}}, Checkout: {{checkoutDate}}, Return: {{returnDate}}{{#if lateReturn}}, Late Return: {{lateReturn}}{{/if}}\n{{/each}}\n\nBased on this data, provide:\n1.  'suggestions': A list of suitable and available keys for the 'desiredKeyPurpose', along with a brief reason for each suggestion. Prioritize keys that are available, match the purpose, and perhaps have a good usage history.\n2.  'conflicts': A list of any potential conflicts or issues. This could include if the 'assigneeId' already has a key of this type, a history of late returns, or if there are no suitable available keys. Assign a severity to each conflict (low, medium, high).\n3.  'overallAnalysis': A concise summary of your findings, justifying your suggestions and conflicts.\n\nConsider the following:\n- Keys must be 'available' to be suggested.\n- If a key type is requested, prioritize keys of that 'type'.\n- Look for patterns in 'historicalUsage' for the given 'assigneeId' to identify potential issues (e.g., frequent late returns for specific key types).\n- If no suitable keys are available, explicitly state that in the conflicts.\n`,
});

const keyAssignmentAssistantFlow = ai.defineFlow(
  {
    name: 'keyAssignmentAssistantFlow',
    inputSchema: KeyAssignmentAssistantInputSchema,
    outputSchema: KeyAssignmentAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await keyAssignmentAssistantPrompt(input);
    if (!output) {
      throw new Error("No output received from the AI assistant.");
    }
    return output;
  }
);
