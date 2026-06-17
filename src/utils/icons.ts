import { Feather } from '@expo/vector-icons';

export type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

export const FEATHER_ICON_OPTIONS: FeatherIconName[] = [
  'activity',
  'airplay',
  'archive',
  'award',
  'bar-chart-2',
  'book',
  'briefcase',
  'calendar',
  'camera',
  'check-circle',
  'clock',
  'coffee',
  'command',
  'credit-card',
  'dollar-sign',
  'edit-3',
  'feather',
  'film',
  'flag',
  'folder',
  'gift',
  'globe',
  'grid',
  'hard-drive',
  'headphones',
  'heart',
  'home',
  'image',
  'inbox',
  'key',
  'layers',
  'life-buoy',
  'map',
  'monitor',
  'moon',
  'package',
  'pen-tool',
  'pie-chart',
  'repeat',
  'scissors',
  'send',
  'server',
  'shopping-bag',
  'shopping-cart',
  'sliders',
  'smartphone',
  'star',
  'sun',
  'tag',
  'target',
  'tool',
  'truck',
  'tv',
  'umbrella',
  'user',
  'users',
  'pocket',
  'watch',
  'wifi',
  'zap',
];

export function isFeatherIconName(value: string | null | undefined): value is FeatherIconName {
  if (!value) {
    return false;
  }

  return Object.prototype.hasOwnProperty.call(Feather.glyphMap, value);
}

export function getIconFallbackLabel(
  value: string | null | undefined,
  fallback: string,
): string {
  const trimmed = value?.trim();

  if (!trimmed) {
    return fallback;
  }

  return trimmed.slice(0, 2).toUpperCase();
}
