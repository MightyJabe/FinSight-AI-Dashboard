import { z } from 'zod';

export const insightItemSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty'),
  description: z.string().min(1, 'Description cannot be empty'),
  actionItems: z.array(z.string()).optional(),
  priority: z.enum(['high', 'medium', 'low']),
});

export const openAIInsightsSchema = z.object({
  insights: z.array(insightItemSchema),
  summary: z.string().min(1, 'Summary cannot be empty'),
  nextSteps: z.array(z.string()).optional(),
});

export type OpenAIInsights = z.infer<typeof openAIInsightsSchema>;
