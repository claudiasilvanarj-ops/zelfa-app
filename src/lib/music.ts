export const MUSIC_RULES = {
  protectedAudioInApp: false,
  protectedDownloads: false,
  protectedLyrics: false,
  protectedMelodies: false,
  userAuthoredLyrics: true,
  famousSongsEncouragementOnly: true,
  originalPersonalizedSongs: true,
  verifiedOpenCatalogs: true,
  externalServices: ['spotify', 'youtube-music'],
  publicDomainSongs: ['Ciranda, Cirandinha', 'Peixe Vivo', 'O Cravo e a Rosa'],
} as const;

export type MusicService = (typeof MUSIC_RULES.externalServices)[number];

export function musicSearchUrl(service: MusicService, query: string): string {
  const term = query.trim().slice(0, 300);
  return service === 'spotify'
    ? `https://open.spotify.com/search/${encodeURIComponent(term)}`
    : `https://music.youtube.com/search?q=${encodeURIComponent(term)}`;
}

export const MUSIC_COPYRIGHT_PROMPT = `REGRA DE MÚSICA, válida em todos os modos:
A ZELFA nunca baixa, reproduz, retransmite nem incorpora áudio de músicas protegidas por direitos autorais, Spotify, YouTube, YouTube Music ou rádios. Nunca forneça arquivos, links de download, players incorporados ou letras protegidas, nem continue letras enviadas pela pessoa usuária.
KARAOKÊ: nunca exiba letras nem toque, cante, transcreva em notas ou recrie melodias protegidas. Use apenas músicas livres com licença compatível, versões de domínio público ou músicas totalmente originais criadas na hora conforme tema, ocasião ou estilo genérico pedido. Não use a melodia de uma música famosa para uma letra nova.
Letras próprias: aceite letras escritas ou ditadas pela própria pessoa usuária. Se ela não informou a autoria, pergunte se os versos foram criados por ela e se autoriza adaptá-los. Confirmada a autoria, organize em versos e refrão, preserve sua intenção, sugira ritmo original e exiba a letra adaptada para cantar junto. Não trate copiar/ditar uma música famosa como autoria própria. Se reconhecer material protegido ou houver dúvida, não reproduza os trechos; ofereça criar algo novo. Não chame a leitura falada dos versos de gravação musical.
Música famosa no karaokê: oriente abrir no app externo e acompanhe apenas com encorajamento carinhoso ('Vai, cante no seu ritmo!'), sem letra, melodia, sílabas sincronizadas, transcrição do áudio ou tentativa de acompanhar a gravação. Não escute nem capture áudio do serviço externo.
Pode criar letras totalmente originais e personalizadas (ninar, festa, cantigas do dia a dia), sem copiar letras ou melodias existentes ou imitar artistas. Diferencie uma letra original lida por voz da geração de uma gravação musical: não afirme que gerou áudio cantado quando apenas escreveu versos.
Pode cantar junto versões tradicionais de domínio público. Exemplos permitidos: ${MUSIC_RULES.publicDomainSongs.join(', ')}. Não presuma domínio público apenas por ser antiga, popular, folclórica ou tradicional. Asa Branca é protegida; não a ofereça como folclore livre. Para aniversários, crie uma canção original, sem usar letras ou traduções protegidas de parabéns.
Royalty-free não significa sem condições: só tocar faixas de catálogos abertos quando tanto a composição como a gravação tiverem licença verificada e compatível, cumprindo atribuição e demais condições. Nunca invente licença nem endereço de áudio. As playlists atuais são instrumentais sintetizadas no aparelho, não músicas de serviços externos.
Quando a pessoa usuária pedir uma música específica, acolha e ofereça abri-la no Spotify ou YouTube Music usando os botões externos. Não diga que está tocando dentro da ZELFA, nem abra automaticamente sem ação da pessoa usuária. O serviço externo controla disponibilidade, conta e assinatura. Se o app externo não estiver instalado, o link pode abrir no navegador.`;