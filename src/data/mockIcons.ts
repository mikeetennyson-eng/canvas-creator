import icons from '@/data/icons.json';
import type { IconData } from '@/types/editor';

export async function fetchIcons(): Promise<IconData[]> {
  return icons as IconData[];
}