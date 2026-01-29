export interface VisualResult {
  id: string;
  type: 'video' | 'image';
  source: 'pixabay' | 'pexels';
  url: string;
  previewUrl: string;
  width: number;
  height: number;
  duration?: number;
}

export interface FetchVisualsResult {
  visuals: VisualResult[];
  keywords: string[];
  totalFound: number;
}
