import type { EmbedData, EmbedProvider } from './Providers/Provider.types';

export type PostLinkEmbedsProps = {
  content: string;
  gamePreview?: boolean;
};

export type ParseUrlForLinkEmbedResult = {
  embed: EmbedData | null;
  provider: EmbedProvider | null;
};
