'use client';
import { useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import { Button } from '@/atoms/Button/Button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/atoms/Dialog/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/atoms/Select/Select';
import { useConfirmableDialog } from '@/hooks/useConfirmableDialog/useConfirmableDialog';
import { useFeedGameForm } from '@/hooks/useFeedGameForm/useFeedGameForm';
import { useRequireAuth } from '@/hooks/useRequireAuth/useRequireAuth';
import { type FeedGame, GAME_REMIX_EVENT, gamePost, gameSchema } from '@/libs/feed-games/game';
import { ControlledInputField } from '@/molecules/ControlledInputField/ControlledInputField';
import { DialogConfirmDiscard } from '@/molecules/DialogConfirmDiscard/DialogConfirmDiscard';
import { FeedGameCard } from '@/molecules/FeedGameCard/FeedGameCard';
import { PostInput } from '@/organisms/PostInput/PostInput';
import { POST_INPUT_VARIANT } from '@/organisms/PostInput/PostInput.constants';

export function FeedGamesStudio() {
  const [game, setGame] = useState<FeedGame | null>(null);
  useEffect(() => {
    const open = (event: Event) => {
      const parsed = gameSchema.safeParse((event as CustomEvent).detail);
      if (parsed.success) setGame(parsed.data);
    };
    window.addEventListener(GAME_REMIX_EVENT, open);
    return () => window.removeEventListener(GAME_REMIX_EVENT, open);
  }, []);
  return game ? <GameEditor key={JSON.stringify(game)} source={game} onClose={() => setGame(null)} /> : null;
}
function GameEditor({ source, onClose }: { source: FeedGame; onClose: () => void }) {
  const { form, prepared, submit, edit } = useFeedGameForm(source);
  const { isAuthenticated, requireAuth } = useRequireAuth();
  const confirm = useConfirmableDialog({ onClose });
  return (
    <Dialog open onOpenChange={confirm.handleOpenChange}>
      <DialogContent className="w-3xl" avoidKeyboard>
        <DialogHeader>
          <DialogTitle>{prepared ? 'Your game post' : 'Make it your game'}</DialogTitle>
          <DialogDescription>
            Choose a look and a challenge. Publish through your Pubky account to let others play and remix in the feed.
          </DialogDescription>
        </DialogHeader>
        {!prepared ? (
          <form
            onSubmit={submit}
            className="flex flex-col gap-5"
            onChange={() => confirm.handleContentChange('edited', [], [], '')}
          >
            <ControlledInputField name="title" control={form.control} label="Game title" maxLength={60} />
            <div className="flex flex-wrap gap-8">
              <Controller
                name="theme"
                control={form.control}
                render={({ field }) => (
                  <div>
                    <span className="text-sm text-muted-foreground">World</span>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        confirm.handleContentChange('edited', [], [], '');
                      }}
                    >
                      <SelectTrigger aria-label="World">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="park">Park</SelectItem>
                        <SelectItem value="sunset">Sunset</SelectItem>
                        <SelectItem value="midnight">Midnight</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
              <Controller
                name="difficulty"
                control={form.control}
                render={({ field }) => (
                  <div>
                    <span className="text-sm text-muted-foreground">Challenge</span>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        confirm.handleContentChange('edited', [], [], '');
                      }}
                    >
                      <SelectTrigger aria-label="Challenge">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Easy</SelectItem>
                        <SelectItem value="2">Medium</SelectItem>
                        <SelectItem value="3">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              The same seed keeps the course repeatable. Remixes keep their source post attached.
            </p>
            <Button type="submit">Preview game post</Button>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <FeedGameCard game={prepared} />
            <Button variant="ghost" onClick={edit}>
              Edit game settings
            </Button>
            {isAuthenticated ? (
              <PostInput
                variant={POST_INPUT_VARIANT.POST}
                expanded
                initialContent={gamePost(prepared, window.location.origin)}
                onSuccess={onClose}
                onContentChange={confirm.handleContentChange}
                layoutOverride="inline"
                submitLabel="Publish game"
              />
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  You can play this preview now. Sign in with a staging test account to publish it.
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
