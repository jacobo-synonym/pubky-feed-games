import { z } from 'zod';

export const feedGameFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Give your game a title.')
    .max(60, 'Use 60 characters or fewer.')
    .regex(/^[^\r\n\u0000-\u001f]+$/, 'Use a single line for the title.'),
  kind: z.enum(['pigeon', 'memory', 'reaction']),
  pattern: z.enum(['balanced', 'hurdles', 'snacks']),
  seed: z
    .string()
    .regex(/^\d+$/, 'Use a whole number.')
    .refine((value) => Number(value) >= 1 && Number(value) <= 2147483647, 'Use a number from 1 to 2147483647.'),
  theme: z.enum(['park', 'sunset', 'midnight']),
  difficulty: z.enum(['1', '2', '3']),
});
export type FeedGameFormData = z.infer<typeof feedGameFormSchema>;
