/**
 *
 */
export function toRgba(color: string, alpha: number): string {
  if (color.startsWith('#')) {
    // Convert hex to rgba
    const hex = color.replace('#', '');
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  // Match both rgb(99,102,241) and rgb(99 102 241)
  const rgbMatch = color.match(/rgb\(([^)]+)\)/);
  if (rgbMatch) {
    const parts = rgbMatch[1].trim().split(/[ ,]+/);
    return `rgba(${parts[0]},${parts[1]},${parts[2]},${alpha})`;
  }
  // If it's just space-separated numbers (from getCssVarColor), handle that too
  if (/^\d+ \d+ \d+$/.test(color.trim())) {
    const parts = color.trim().split(' ');
    return `rgba(${parts[0]},${parts[1]},${parts[2]},${alpha})`;
  }
  return color;
}
