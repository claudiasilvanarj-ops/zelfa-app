import { describe, expect, it } from 'vitest';
import { withinCameraHours, LIVE_RULES, frameDifference } from '@/lib/family-live';

describe('autorização da câmera', () => {
  it('exige aprovação', () => expect(LIVE_RULES.requiresApproval).toBe(true));
  it('não grava imagens', () => expect(LIVE_RULES.recordsMedia).toBe(false));
  it('respeita horários de Brasília inclusive madrugada', () => {
    expect(withinCameraHours('22:00', '06:00', new Date('2026-10-28T02:00:00Z'))).toBe(true);
    expect(withinCameraHours('22:00', '06:00', new Date('2026-10-28T15:00:00Z'))).toBe(false);
    expect(withinCameraHours('08:00', '10:00', new Date('2026-10-28T13:00:00Z'))).toBe(false);
  });
  it('detecta variação de imagem, não interpreta saúde', () => {
    expect(frameDifference(new Uint8ClampedArray([0,0,0,255]), new Uint8ClampedArray([50,0,0,255]))).toBe(50);
  });
});