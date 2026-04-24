import { z } from 'zod';

export const CreatePetSchema = z.object({
  name: z.string().min(1).max(20),
  species: z.enum(['cat', 'dragon', 'blob', 'plant', 'rock']),
});

export const UpdatePetSchema = z.object({
  name: z.string().min(1).max(20),
});

export type CreatePetInput = z.infer<typeof CreatePetSchema>;
export type UpdatePetInput = z.infer<typeof UpdatePetSchema>;
