export const DEFAULT_SATURATION = 40;
export const DEFAULT_LIGHTNESS = 75;

export function clampHue(value: number): number {
  return Math.max(0, Math.min(360, Math.round(value)));
}

export function hslToHex(h: number, s: number, l: number): string {
  const lightness = l / 100;
  const a = (s * Math.min(lightness, 1 - lightness)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = lightness - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function hexToHue(hex: string): number | null {
  const normalized = hex.trim().replace('#', '');
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map(ch => ch + ch)
          .join('')
      : normalized;

  const r = parseInt(expanded.substring(0, 2), 16) / 255;
  const g = parseInt(expanded.substring(2, 4), 16) / 255;
  const b = parseInt(expanded.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  if (delta === 0) {
    return 0;
  }

  let hue = 0;
  switch (max) {
    case r:
      hue = ((g - b) / delta) % 6;
      break;
    case g:
      hue = (b - r) / delta + 2;
      break;
    default:
      hue = (r - g) / delta + 4;
      break;
  }

  hue *= 60;
  if (hue < 0) {
    hue += 360;
  }

  return Math.round(hue);
}
