import { z } from 'zod';

export const feedGameFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Give your game a title.')
    .max(60, 'Use 60 characters or fewer.')
    .regex(/^[^\r\n\u0000-\u001f]+$/, 'Use a single line for the title.'),
  theme: z.enum(['park', 'sunset', 'midnight']),
  difficulty: z.enum(['1', '2', '3']),
});
export type FeedGameFormData = z.infer<typeof feedGameFormSchema>;
