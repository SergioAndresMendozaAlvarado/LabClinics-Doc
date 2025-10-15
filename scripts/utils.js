const NON_DIGITS = /[^\d+]/g;

export const slugify = (value = '') => value
  .toString()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)+/g, '');

export const formatFullName = (firstName = '', lastName = '') => `${firstName} ${lastName}`.replace(/\s+/g, ' ').trim();

export const cleanPhone = (phone = '') => phone.toString().replace(NON_DIGITS, '');

export const buildTelLink = (phone = '') => {
  const normalized = cleanPhone(phone);
  return normalized ? `tel:${normalized}` : '#';
};

export const buildWhatsAppLink = (phone = '') => {
  const normalized = cleanPhone(phone).replace(/^0+/, '');
  return normalized ? `https://wa.me/${normalized}` : '#';
};

export const ensureArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map((item) => item.toString().trim()).filter(Boolean);
  return value
    .toString()
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

export const uniqueSorted = (items = []) => [...new Set(items.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

export const sanitizeUrl = (url = '') => {
  const trimmed = url.toString().trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export const cleanObject = (obj = {}) => Object.fromEntries(
  Object.entries(obj).filter(([, value]) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  }),
);

export const parseTreatments = (value) => ensureArray(value);

export const parseSpecialties = (value) => ensureArray(value);

export const toDate = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toDate) return timestamp.toDate();
  if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
  return new Date(timestamp);
};
