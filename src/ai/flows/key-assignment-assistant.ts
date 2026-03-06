'use server';
/**
 * @fileOverview Intelligent Key Assignment Assistant.
 *
 * This flow analyzes a user's request for a key and suggests the most
 * appropriate available key while flagging potential policy conflicts.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const KeySchema = z.object({
  keyId: z.string(),
  name: z.string(),
  type: z.string(),
  location: z.string(),
  status: z.enum(['available', 'checked_out', 'overdue']),
});

const KeyAssignmentAssistantInputSchema = z.object({
  requestPurpose: z.string().describe('The reason or purpose the user needs a key.'),
  availableKeys: z.array(KeySchema).describe('The list of currently registered keys and their status.'),
  userRole: z.string().describe('The role of the user requesting the assistant.'),
});

const KeyAssignmentAssistantOutputSchema = z.object({
  suggestions: z.array(z.object({
    keyId: z.string(),
    name: z.string(),
    reason: z.string().describe('Why this key is a good match for the request.'),
    confidence: z.number().min(0).max(1),
  })),
  conflicts: z.array(z.object({
    keyId: z.string().optional(),
    severity: z.enum(['low', 'medium', 'high']),
    description: z.string().describe('Description of the potential policy or safety conflict.'),
  })),
  overallAnalysis: z.string().describe('A brief summary of the recommendation.'),
});

export type KeyAssignmentAssistantInput = z.infer<typeof KeyAssignmentAssistantInputSchema>;
export type KeyAssignmentAssistantOutput = z.infer<typeof KeyAssignmentAssistantOutputSchema>;

const assistantPrompt = ai.definePrompt({
  name: 'keyAssignmentAssistantPrompt',
  input: { schema: KeyAssignmentAssistantInputSchema },
  output: { schema: KeyAssignmentAssistantOutputSchema },
  prompt: `
    You are the KeyFlow Pro AI Assistant. Your goal is to help staff members find the correct physical key for their tasks.

    Context:
    - User Role: {{{userRole}}}
    - Requested Purpose: {{{requestPurpose}}}
    - Key Inventory:
    {{#each availableKeys}}
    - [{{keyId}}] {{name}} (Type: {{type}}, Location: {{location}}, Status: {{status}})
    {{/each}}

    Instructions:
    1. Match the "Requested Purpose" to the most logical keys in the inventory.
    2. Prioritize keys with "available" status.
    3. If a key is "checked_out" or "overdue", mention it as a conflict if it's the only match.
    4. If the request involves dangerous machinery (Machine type) and the user isn't an Admin, flag a "medium" severity conflict.
    5. Be concise and professional.
  `,
});

export async function keyAssignmentAssistant(input: KeyAssignmentAssistantInput): Promise<KeyAssignmentAssistantOutput> {
  const { output } = await assistantPrompt(input);
  if (!output) throw new Error("AI failed to generate a recommendation.");
  return output;
}
