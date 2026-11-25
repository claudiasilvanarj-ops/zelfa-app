export function withinCameraHours(start: string, end: string, at = new Date()): boolean {
  const clock = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(at);
  const a = start.slice(0, 5), b = end.slice(0, 5);
  return a === b || (a < b ? clock >= a && clock < b : clock >= a || clock < b);
}

export const LIVE_RULES = { requiresApproval: true, recordsMedia: false, noMovementMinutes: 15, alertCooldownSeconds: 60 } as const;

export function frameDifference(previous: Uint8ClampedArray, next: Uint8ClampedArray): number {
  if (previous.length !== next.length || !next.length) return 0;
  let total = 0;
  for (let i = 0; i < next.length; i += 4) total += Math.abs((previous[i] ?? 0) - (next[i] ?? 0));
  return total / (next.length / 4);
}