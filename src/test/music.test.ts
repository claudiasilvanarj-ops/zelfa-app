import { describe, expect, it } from 'vitest';
import { MUSIC_RULES, musicSearchUrl } from '@/lib/music';

describe('direitos autorais de música', () => {
  it('não toca áudio protegido dentro da ZELFA', () => expect(MUSIC_RULES.protectedAudioInApp).toBe(false));
  it('não baixa músicas protegidas', () => expect(MUSIC_RULES.protectedDownloads).toBe(false));
  it('não reproduz letras protegidas', () => expect(MUSIC_RULES.protectedLyrics).toBe(false));
  it('não toca melodias protegidas no karaokê', () => expect(MUSIC_RULES.protectedMelodies).toBe(false));
  it('aceita letras de autoria da usuária', () => expect(MUSIC_RULES.userAuthoredLyrics).toBe(true));
  it('acompanha músicas famosas somente com encorajamento', () => expect(MUSIC_RULES.famousSongsEncouragementOnly).toBe(true));
  it('permite criação original personalizada', () => expect(MUSIC_RULES.originalPersonalizedSongs).toBe(true));
  it('permite catálogos abertos somente com licença verificada', () => expect(MUSIC_RULES.verifiedOpenCatalogs).toBe(true));
  it('permite cantigas tradicionais, sem incluir Asa Branca', () => {
    expect(MUSIC_RULES.publicDomainSongs).toContain('Ciranda, Cirandinha');
    expect(MUSIC_RULES.publicDomainSongs).not.toContain('Asa Branca');
  });
  it('abre busca externa no Spotify com o pedido codificado', () => {
    expect(musicSearchUrl('spotify', 'Asa Branca')).toBe('https://open.spotify.com/search/Asa%20Branca');
  });
  it('abre YouTube Music sem incorporar áudio ou permitir injeção no link', () => {
    const url = new URL(musicSearchUrl('youtube-music', 'A & B? #festa'));
    expect(url.origin).toBe('https://music.youtube.com');
    expect(url.pathname).toBe('/search');
    expect(url.searchParams.get('q')).toBe('A & B? #festa');
    expect(url.hash).toBe('');
  });
});