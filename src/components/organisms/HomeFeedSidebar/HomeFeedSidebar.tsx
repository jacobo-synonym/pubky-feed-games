'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { APP_ROUTES } from '@/app/routes';
import { Container } from '@/atoms/Container/Container';
import { TIMELINE_FEED_VARIANT, type TimelineFeedVariant } from '@/config/feed';
import { TAGGED_AS_FILTER_KEY } from '@/config/feed';
import { FEED_GAMES_ENABLED } from '@/config/feedGames';
import { useFeedLayoutResolution } from '@/hooks/useFeedLayoutResolution/useFeedLayoutResolution';
import { useRequireAuth } from '@/hooks/useRequireAuth/useRequireAuth';
import { useSelectedReachFilter } from '@/hooks/useSelectedReachFilter/useSelectedReachFilter';
import { GAME_TAG } from '@/libs/feed-games/game';
import { FilterContent } from '@/molecules/Filters/FilterContent/FilterContent';
import { FilterLayout } from '@/molecules/Filters/FilterLayout/FilterLayout';
import { FilterReach } from '@/molecules/Filters/FilterReach/FilterReach';
import { FilterSort } from '@/molecules/Filters/FilterSort/FilterSort';
import { useAuthStore } from '@/stores/auth/auth.store';
import { useHomeStore } from '@/stores/home/home.store';
import { type ReachFilterValue } from '@/stores/home/home.types';
import { CONTENT, type ContentType, LAYOUT, REACH, type ReachType } from '@/stores/home/home.types';
import {
  resolveVisualFeedContent,
  VISUAL_DISABLED_CONTENT,
} from '../Timeline/Feed/TimelineFeed/TimelineFeedVisual.helpers';

interface HomeFeedSidebarProps {
  hideReachFilter?: boolean;
  hideSortFilter?: boolean;
  hideLayoutFilter?: boolean;
  allowVisualLayout?: boolean;
  feedVariant?: TimelineFeedVariant;
  variant?: 'sidebar' | 'drawer';
}

/**
 * HomeFeedFilters
 *
 * Base component for Home feed filters - manages filter state via useHomeStore.
 * Used by sidebar (desktop) and drawer (tablet/mobile) variants.
 *
 * Order follows Figma design: Reach → Sort → Layout → Content
 * Gap between sections: 24px (gap-6)
 */
function HomeFeedFilters({
  hideReachFilter = false,
  hideSortFilter = false,
  hideLayoutFilter = false,
  allowVisualLayout = false,
  feedVariant = TIMELINE_FEED_VARIANT.HOME,
  variant = 'drawer',
}: HomeFeedSidebarProps) {
  const {
    layout,
    setLayout,
    setReach,
    taggedAsActive,
    setTaggedAsActive,
    sort,
    setSort,
    content,
    setContent,
    profileTags,
    addProfileTag,
    removeProfileTag,
  } = useHomeStore();
  const router = useRouter();
  const params = useSearchParams();
  const gamesSelected = FEED_GAMES_ENABLED && params.get('tags') === GAME_TAG && !params.get('q');
  const selectGames = () => {
    setContent(CONTENT.ALL);
    // Visual layout only includes media posts; games are ordinary link posts.
    if (isVisualActive) setLayout(LAYOUT.COLUMNS);
    router.push(`${APP_ROUTES.SEARCH}?tags=${GAME_TAG}`);
  };
  const selectContent = (value: ContentType) => {
    setContent(value);
    if (gamesSelected) router.push(APP_ROUTES.HOME);
  };
  const currentUserPubky = useAuthStore((state) => state.currentUserPubky);
  const { requireAuth } = useRequireAuth();
  const isAuthenticated = Boolean(currentUserPubky);
  const selectedReach = useSelectedReachFilter();
  const effectiveProfileTags = isAuthenticated ? profileTags : [];
  const { isPhoneViewport, isVisualActive } = useFeedLayoutResolution(feedVariant);

  // "All" reach is public; other reach options require an account, so prompt Join Pubky in Explore mode.
  const handleReachChange = (value: ReachFilterValue) => {
    if (value === REACH.ALL) {
      // Signed-out Home already resolves to All. Avoid persisting this no-op as
      // an explicit choice so a visitor remains eligible for the post-signup
      // My-network default.
      if (isAuthenticated) {
        setReach(value);
      }
      return;
    }

    requireAuth(() => {
      if (value === TAGGED_AS_FILTER_KEY) {
        setTaggedAsActive(true);
        return;
      }

      setReach(value as ReachType);
    });
  };
  const resolvedContent = resolveVisualFeedContent({
    content,
    variant: feedVariant,
    isVisualActive,
  });

  const disabledContentTabs = isVisualActive ? VISUAL_DISABLED_CONTENT : [];
  const showVisualLayout = allowVisualLayout && !isPhoneViewport && !gamesSelected;

  return (
    <Container overrideDefaults className="flex flex-col gap-6">
      {!hideReachFilter && (
        <FilterReach
          selectedTab={selectedReach}
          onTabChange={handleReachChange}
          showTaggedAs
          profileTags={effectiveProfileTags}
          onProfileTagAdd={addProfileTag}
          onProfileTagRemove={removeProfileTag}
          profileTagsDisabled={!isAuthenticated || !taggedAsActive}
        />
      )}
      {!hideSortFilter && <FilterSort selectedTab={sort} onTabChange={setSort} />}
      {variant === 'sidebar' ? (
        <Container overrideDefaults className="sticky top-[100px] flex w-full flex-col gap-6 self-start">
          {!hideLayoutFilter && (
            <FilterLayout selectedTab={layout} onTabChange={setLayout} showVisual={showVisualLayout} />
          )}
          <FilterContent
            selectedTab={resolvedContent}
            onTabChange={selectContent}
            disabledTabs={disabledContentTabs}
            gamesSelected={gamesSelected}
            onGamesSelect={FEED_GAMES_ENABLED ? selectGames : undefined}
          />
        </Container>
      ) : (
        <>
          {!hideLayoutFilter && (
            <FilterLayout selectedTab={layout} onTabChange={setLayout} showVisual={showVisualLayout} />
          )}
          <FilterContent
            selectedTab={resolvedContent}
            onTabChange={selectContent}
            disabledTabs={disabledContentTabs}
            gamesSelected={gamesSelected}
            onGamesSelect={FEED_GAMES_ENABLED ? selectGames : undefined}
          />
        </>
      )}
    </Container>
  );
}

/**
 * HomeFeedSidebar
 *
 * Left sidebar for Home feed (desktop) - manages filter state via useHomeStore.
 * Desktop version with sticky positioning.
 */
export function HomeFeedSidebar({
  hideReachFilter = false,
  hideSortFilter = false,
  allowVisualLayout = false,
  feedVariant = TIMELINE_FEED_VARIANT.HOME,
}: HomeFeedSidebarProps) {
  return (
    <HomeFeedFilters
      hideReachFilter={hideReachFilter}
      hideSortFilter={hideSortFilter}
      allowVisualLayout={allowVisualLayout}
      feedVariant={feedVariant}
      variant="sidebar"
    />
  );
}

/**
 * HomeFeedDrawer
 *
 * Left drawer for Home feed (tablet) - manages filter state via useHomeStore.
 */
export function HomeFeedDrawer({
  hideReachFilter = false,
  hideSortFilter = false,
  allowVisualLayout = false,
  feedVariant = TIMELINE_FEED_VARIANT.HOME,
}: HomeFeedSidebarProps) {
  return (
    <HomeFeedFilters
      hideReachFilter={hideReachFilter}
      hideSortFilter={hideSortFilter}
      allowVisualLayout={allowVisualLayout}
      feedVariant={feedVariant}
      variant="drawer"
    />
  );
}

/**
 * HomeFeedDrawerMobile
 *
 * Left drawer for Home feed (mobile) - manages filter state via useHomeStore.
 * Note: Mobile version doesn't show layout filter.
 */
export function HomeFeedDrawerMobile({
  hideReachFilter = false,
  hideSortFilter = false,
  allowVisualLayout = false,
  feedVariant = TIMELINE_FEED_VARIANT.HOME,
}: HomeFeedSidebarProps) {
  return (
    <HomeFeedFilters
      hideReachFilter={hideReachFilter}
      hideSortFilter={hideSortFilter}
      hideLayoutFilter
      allowVisualLayout={allowVisualLayout}
      feedVariant={feedVariant}
      variant="drawer"
    />
  );
}
