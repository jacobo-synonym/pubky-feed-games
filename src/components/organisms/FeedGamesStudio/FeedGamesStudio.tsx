'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Controller } from 'react-hook-form';
import { Button } from '@/atoms/Button/Button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/atoms/Dialog/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/atoms/Select/Select';
import { FEED_GAMES_ENABLED } from '@/config/feedGames';
import { useConfirmableDialog } from '@/hooks/useConfirmableDialog/useConfirmableDialog';
import { useFeedGameForm } from '@/hooks/useFeedGameForm/useFeedGameForm';
import { useRequireAuth } from '@/hooks/useRequireAuth/useRequireAuth';
import {
  ARCADE_GAMES,
  type FeedGame,
  GAME_CREATE_EVENT,
  GAME_RESULT_EVENT,
  GAME_TAG,
  gameCover,
  gameDescription,
  type GameEditorRequest,
  gamePost,
  type GameResultRequest,
  gameSchema,
  resultPost,
  resultRequestSchema,
} from '@/libs/feed-games/game';
import { ControlledInputField } from '@/molecules/ControlledInputField/ControlledInputField';
import { DialogConfirmDiscard } from '@/molecules/DialogConfirmDiscard/DialogConfirmDiscard';
import { FeedGameCard } from '@/molecules/FeedGameCard/FeedGameCard';
import { PostInput } from '@/organisms/PostInput/PostInput';
import { POST_INPUT_VARIANT } from '@/organisms/PostInput/PostInput.constants';

export function FeedGamesStudio() {
  const [request, setRequest] = useState<GameEditorRequest | null>(null);
  const [result, setResult] = useState<GameResultRequest | null>(null);
  useEffect(() => {
    if (!FEED_GAMES_ENABLED) return;
    const open = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      const parsed = gameSchema.safeParse(detail?.game ?? detail);
      if (parsed.success) {
        setResult(null);
        setRequest({
          game: parsed.data,
          onInsert: typeof detail?.onInsert === 'function' ? detail.onInsert : undefined,
        });
      }
    };
    const share = (event: Event) => {
      const parsed = resultRequestSchema.safeParse((event as CustomEvent).detail);
      if (parsed.success) {
        setRequest(null);
        setResult(parsed.data);
      }
    };
    window.addEventListener(GAME_CREATE_EVENT, open);
    window.addEventListener(GAME_RESULT_EVENT, share);
    return () => {
      window.removeEventListener(GAME_CREATE_EVENT, open);
      window.removeEventListener(GAME_RESULT_EVENT, share);
    };
  }, []);
  return (
    <>
      {request && (
        <GameEditor
          key={JSON.stringify(request.game)}
          source={request.game}
          onInsert={request.onInsert}
          onClose={() => setRequest(null)}
        />
      )}
      {result && <GameResultEditor request={result} onClose={() => setResult(null)} />}
    </>
  );
}
function GameEditor({
  source,
  onClose,
  onInsert,
}: {
  source: FeedGame;
  onClose: () => void;
  onInsert?: (game: FeedGame) => void;
}) {
  const { form, prepared, submit, edit } = useFeedGameForm(source);
  const { isAuthenticated, requireAuth } = useRequireAuth();
  const confirm = useConfirmableDialog({ onClose });
  const kind = form.watch('kind');
  const changed = () => confirm.handleContentChange('edited', [], [], '');
  return (
    <Dialog open onOpenChange={confirm.handleOpenChange}>
      <DialogContent className="w-3xl" avoidKeyboard>
        <DialogHeader>
          <DialogTitle>{prepared ? 'Your game post' : 'Make a game post'}</DialogTitle>
          <DialogDescription>Pick a game. Set the challenge. Let your feed play along.</DialogDescription>
        </DialogHeader>
        {!prepared ? (
          <form onSubmit={submit} className="flex flex-col gap-5" onChange={changed}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="Game templates">
              {ARCADE_GAMES.map((template) => (
                <button
                  type="button"
                  key={template.kind}
                  aria-pressed={kind === template.kind}
                  className={`overflow-hidden rounded-xl border text-left transition-colors focus-visible:outline-2 focus-visible:outline-ring ${kind === template.kind ? 'border-primary bg-secondary' : 'border-border hover:bg-secondary'}`}
                  onClick={() => {
                    form.setValue('kind', template.kind);
                    form.setValue('title', template.title);
                    changed();
                  }}
                >
                  <Image src={gameCover(template)} width={210} height={126} alt="" unoptimized className="w-full" />
                  <span className="block p-2 text-xs font-bold sm:text-sm">{template.title}</span>
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{gameDescription({ ...source, kind })}</p>
            <ControlledInputField name="title" control={form.control} label="Game title" maxLength={60} />
            <div className="grid grid-cols-2 gap-4">
              {(['theme', 'difficulty', ...(kind === 'pigeon' ? (['pattern'] as const) : [])] as const).map((name) => (
                <Controller
                  key={name}
                  name={name}
                  control={form.control}
                  render={({ field }) => (
                    <div className="flex flex-col gap-2">
                      <span className="text-sm text-muted-foreground">
                        {name === 'theme' ? 'World' : name === 'difficulty' ? 'Challenge' : 'Course style'}
                      </span>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          changed();
                        }}
                      >
                        <SelectTrigger
                          aria-label={name === 'theme' ? 'World' : name === 'difficulty' ? 'Challenge' : 'Course style'}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(name === 'theme'
                            ? [
                                ['park', 'Park'],
                                ['sunset', 'Sunset'],
                                ['midnight', 'Midnight'],
                              ]
                            : name === 'difficulty'
                              ? [
                                  ['1', 'Easy'],
                                  ['2', 'Medium'],
                                  ['3', 'Hard'],
                                ]
                              : [
                                  ['balanced', 'Balanced'],
                                  ['hurdles', 'More hurdles'],
                                  ['snacks', 'Snack trail'],
                                ]
                          ).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
              ))}
            </div>
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <ControlledInputField name="seed" control={form.control} label="Course number" />
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  form.setValue('seed', String((crypto.getRandomValues(new Uint32Array(1))[0] % 2147483647) + 1));
                  changed();
                }}
              >
                Shuffle
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">The same settings give everyone the same challenge.</p>
            <Button type="submit">Preview game post</Button>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <FeedGameCard game={prepared} preview />
            <Button variant="ghost" onClick={edit}>
              Edit game settings
            </Button>
            {onInsert ? (
              <Button
                onClick={() => {
                  onInsert(prepared);
                  onClose();
                }}
              >
                Add game to post
              </Button>
            ) : isAuthenticated ? (
              <PostInput
                variant={POST_INPUT_VARIANT.POST}
                expanded
                initialContent={gamePost(prepared, window.location.origin)}
                initialTags={[GAME_TAG]}
                hideGameButton
                hideLinkEmbeds
                onSuccess={onClose}
                onContentChange={confirm.handleContentChange}
                layoutOverride="inline"
                submitLabel="Publish game"
              />
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Play the preview now. Sign in to publish it to the staging feed.
                </p>
                <Button onClick={() => requireAuth(() => {})}>Sign in to publish</Button>
              </>
            )}
          </div>
        )}
        <DialogConfirmDiscard
          open={confirm.showConfirmDialog}
          onOpenChange={() => confirm.setShowConfirmDialog(false)}
          onConfirm={confirm.handleDiscard}
        />
      </DialogContent>
    </Dialog>
  );
}
function GameResultEditor({ request, onClose }: { request: GameResultRequest; onClose: () => void }) {
  const { isAuthenticated, requireAuth } = useRequireAuth();
  const confirm = useConfirmableDialog({ onClose });
  return (
    <Dialog open onOpenChange={confirm.handleOpenChange}>
      <DialogContent className="w-3xl" avoidKeyboard>
        <DialogHeader>
          <DialogTitle>{request.postId ? 'Reply with your score' : 'Start a challenge'}</DialogTitle>
          <DialogDescription>
            {request.postId
              ? 'Your result is a normal reply to this game post. Scores are casual and self-reported.'
              : 'This sample has no original post. Publish your own challenge for friends to reply to.'}
          </DialogDescription>
        </DialogHeader>
        {isAuthenticated ? (
          <PostInput
            {...(request.postId
              ? { variant: POST_INPUT_VARIANT.REPLY, postId: request.postId }
              : { variant: POST_INPUT_VARIANT.POST })}
            expanded
            hideGameButton
            initialContent={resultPost(request, window.location.origin)}
            initialTags={[GAME_TAG]}
            onSuccess={onClose}
            onContentChange={confirm.handleContentChange}
            layoutOverride="inline"
            submitLabel={request.postId ? 'Post score reply' : 'Publish challenge'}
          />
        ) : (
          <Button onClick={() => requireAuth(() => {})}>Sign in to share your score</Button>
        )}
        <DialogConfirmDiscard
          open={confirm.showConfirmDialog}
          onOpenChange={() => confirm.setShowConfirmDialog(false)}
          onConfirm={confirm.handleDiscard}
        />
      </DialogContent>
    </Dialog>
  );
}
