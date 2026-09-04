import type { CheckStatus } from '../core/types.js';

interface BadgeOptions {
  label?: string;
  status: string;
  color?: string;
}

const STATUS_COLORS: Record<string, string> = {
  operational: '#4c1', // Bright green
  degraded: '#dfb317', // Yellow-amber
  'schema-drift': '#fe7d37', // Orange
  'schema drift': '#fe7d37', // Orange
  'secret-leak': '#e05d44', // Dark Red
  'secret leak': '#e05d44', // Dark Red
  down: '#e05d44', // Red
  offline: '#e05d44', // Red
  unknown: '#9f9f9f', // Gray
};

/**
 * Estimates text pixel width using average character widths for Verdana font
 */
function estimateTextWidth(text: string): number {
  return Math.round(text.length * 6.8 + 12);
}

/**
 * Generates an accessible, crisp Shields.io-style SVG badge
 */
export function generateBadgeSvg(options: BadgeOptions): string {
  const label = options.label || 'mcp';
  const status = options.status;
  const color = options.color || STATUS_COLORS[status.toLowerCase()] || '#4c1';

  const labelWidth = estimateTextWidth(label);
  const statusWidth = estimateTextWidth(status);
  const totalWidth = labelWidth + statusWidth;

  const labelX = Math.round(labelWidth / 2);
  const statusX = Math.round(labelWidth + statusWidth / 2);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${status}">
  <title>${label}: ${status}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${statusWidth}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text aria-hidden="true" x="${labelX * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)">${label}</text>
    <text x="${labelX * 10}" y="140" transform="scale(.1)" fill="#fff">${label}</text>
    <text aria-hidden="true" x="${statusX * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)">${status}</text>
    <text x="${statusX * 10}" y="140" transform="scale(.1)" fill="#fff">${status}</text>
  </g>
</svg>`;
}

/**
 * Generates status badge for monitor check status
 */
export function generateStatusBadge(status: CheckStatus): string {
  const displayStatus =
    status === 'operational'
      ? 'operational'
      : status === 'schema-drift'
      ? 'schema drift'
      : status === 'secret-leak'
      ? 'secret leak'
      : status === 'down'
      ? 'offline'
      : 'degraded';

  return generateBadgeSvg({
    label: 'mcp',
    status: displayStatus,
  });
}

/**
 * Generates schema integrity badge
 */
export function generateSchemaBadge(hasDrift: boolean, isBreaking: boolean): string {
  if (!hasDrift) {
    return generateBadgeSvg({
      label: 'mcp schema',
      status: 'verified',
      color: '#007ec6', // Crisp blue
    });
  }

  return generateBadgeSvg({
    label: 'mcp schema',
    status: isBreaking ? 'breaking drift' : 'updated',
    color: isBreaking ? '#fe7d37' : '#dfb317',
  });
}
