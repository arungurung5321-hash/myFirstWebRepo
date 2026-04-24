import { z } from 'zod';

export const CreateHabitSchema = z.object({
  name: z.string().min(1).max(50),
  category: z.enum(['health', 'fitness', 'mindfulness', 'learning', 'social']),
  targetFrequency: z.number().int().min(1).max(7),
  statBoost: z.enum(['happiness', 'hunger', 'energy']),
});

export type CreateHabitInput = z.infer<typeof CreateHabitSchema>;
