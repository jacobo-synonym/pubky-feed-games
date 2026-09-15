'use client';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { FeedGame } from '@/libs/feed-games/game';
import { type FeedGameFormData, feedGameFormSchema } from './useFeedGameForm.types';

export function useFeedGameForm(source: FeedGame) {
  const [prepared, setPrepared] = useState<FeedGame | null>(null);
  const form = useForm<FeedGameFormData>({
    resolver: zodResolver(feedGameFormSchema),
    defaultValues: {
      title: source.title,
      theme: source.theme,
      difficulty: String(source.difficulty) as FeedGameFormData['difficulty'],
    },
  });
  const submit = form.handleSubmit((values) => {
    setPrepared({ ...source, ...values, difficulty: Number(values.difficulty) as FeedGame['difficulty'] });
  });
  return { form, prepared, submit, edit: () => setPrepared(null) };
}
