// Shared SEO & SSR utilities for Vercel Serverless Functions (ignored as route because of '_' prefix)

export const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbw-0Y0IM-uR326H4bkWAvbQ179Q5NrfgJT8ihOf8lY7C_joVwrT136fPRjRqu8U9jhU/exec';

export function isSearchCrawler(userAgent = '') {
  return /bot|crawl|spider|slurp|google-inspectiontool|whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|slackbot|discordbot|linkedinbot|pinterest/i.test(
    String(userAgent).toLowerCase()
  );
}

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generatePesantrenSlug(item) {
  if (!item) return '';
  const rawName = String(item.nama || item.nama_resmi || '').toLowerCase();
  const baseName = rawName.replace(/^(pondok\s+pesantren|pesantren|ponpes|pp\.|pp)\s+/i, '');
  const slug = baseName
    .trim()
    .replace(/['"’`]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return slug || (item.kode_pesantren ? String(item.kode_pesantren).toLowerCase() : String(item.id || ''));
}
