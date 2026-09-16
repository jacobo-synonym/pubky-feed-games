'use client';

import * as React from 'react';
import { CirclePlay, Download, Gamepad2, Image, Layers, Library, Link, Newspaper, StickyNote } from 'lucide-react';
import { CONTENT, type ContentType } from '@/stores/home/home.types';
import { FilterRadioGroup } from '../FilterRadioGroup/FilterRadioGroup';
import { BaseFilterProps } from '../Filters.types';

interface FilterContentProps extends BaseFilterProps<ContentType> {
  disabledTabs?: ContentType[];
  gamesSelected?: boolean;
  onGamesSelect?: () => void;
}
export function FilterContent({
  selectedTab,
  defaultSelectedTab = CONTENT.ALL,
  onTabChange,
  disabled,
  disabledTabs = [],
  gamesSelected = false,
  onGamesSelect,
}: FilterContentProps) {
  const disabledSet = React.useMemo(() => new Set(disabledTabs), [disabledTabs]);
  const isDisabled = React.useCallback(
    (contentType: ContentType) => {
      return disabled || disabledSet.has(contentType) ? true : undefined;
    },
    [disabled, disabledSet],
  );
  const items = React.useMemo(
    () => [
      {
        key: CONTENT.ALL,
        label: 'All',
        icon: Layers,
        disabled: isDisabled(CONTENT.ALL),
      },
      {
        key: CONTENT.SHORT,
        label: 'Posts',
        icon: StickyNote,
        disabled: isDisabled(CONTENT.SHORT),
      },
      {
        key: CONTENT.LONG,
        label: 'Articles',
        icon: Newspaper,
        disabled: isDisabled(CONTENT.LONG),
      },
      {
        key: CONTENT.COLLECTIONS,
        label: 'Collections',
        icon: Library,
        disabled: isDisabled(CONTENT.COLLECTIONS),
      },
      {
        key: CONTENT.IMAGES,
        label: 'Images',
        icon: Image,
        disabled: isDisabled(CONTENT.IMAGES),
      },
      {
        key: CONTENT.VIDEOS,
        label: 'Videos',
        icon: CirclePlay,
        disabled: isDisabled(CONTENT.VIDEOS),
      },
      {
        key: CONTENT.LINKS,
        label: 'Links',
        icon: Link,
        disabled: isDisabled(CONTENT.LINKS),
      },
      {
        key: CONTENT.FILES,
        label: 'Files',
        icon: Download,
        disabled: isDisabled(CONTENT.FILES),
      },
    ],
    [isDisabled],
  );
  return (
    <FilterRadioGroup
      title={'Content'}
      items={onGamesSelect ? [...items, { key: 'games', label: 'Games', icon: Gamepad2, disabled }] : items}
      selectedValue={gamesSelected ? 'games' : selectedTab}
      defaultValue={defaultSelectedTab}
      onChange={(value) => (value === 'games' ? onGamesSelect?.() : onTabChange?.(value as ContentType))}
    />
  );
}
