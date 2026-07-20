import content from './content.json';
import type { PortfolioContent } from '@/types/content';

export const getContent = (): PortfolioContent => content as PortfolioContent;
