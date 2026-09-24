/** Formats seconds as m:ss (or h:mm:ss), optionally with tenths for precise review. */
export function formatTime(totalSec: number, withTenths = false): string {
  if (!Number.isFinite(totalSec) || totalSec < 0) totalSec = 0;
  const tenths = Math.floor((totalSec % 1) * 10);
  const whole = Math.floor(totalSec);
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const s = whole % 60;
  const ss = String(s).padStart(2, '0');
  const base = h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
  return withTenths ? `${base}.${tenths}` : base;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
