import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { musicSearchUrl } from '@/lib/music';

export function MusicExternalLinks({ query, beforeOpen }: { query: string; beforeOpen?: () => void }) {
  if (!query.trim()) return null;
  return <div className="flex flex-wrap gap-2">
    <Button asChild variant="outline" className="h-auto whitespace-normal py-3 text-base">
      <a href={musicSearchUrl('spotify', query)} target="_blank" rel="noopener noreferrer" onClick={beforeOpen}><ExternalLink />Abrir no Spotify</a>
    </Button>
    <Button asChild variant="outline" className="h-auto whitespace-normal py-3 text-base">
      <a href={musicSearchUrl('youtube-music', query)} target="_blank" rel="noopener noreferrer" onClick={beforeOpen}><ExternalLink />Abrir no YouTube Music</a>
    </Button>
  </div>;
}