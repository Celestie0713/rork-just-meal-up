export const COUNTRY_CURRENCIES: { [key: string]: string } = {
  'US': '$',
  'USA': '$',
  'United States': '$',
  'Canada': 'CA$',
  'CA': 'CA$',
  'UK': '£',
  'United Kingdom': '£',
  'GB': '£',
  'EU': '€',
  'Germany': '€',
  'France': '€',
  'Italy': '€',
  'Spain': '€',
  'Netherlands': '€',
  'Belgium': '€',
  'Austria': '€',
  'Portugal': '€',
  'Greece': '€',
  'Ireland': '€',
  'Japan': '¥',
  'JP': '¥',
  'China': '¥',
  'CN': '¥',
  'India': '₹',
  'IN': '₹',
  'Australia': 'A$',
  'AU': 'A$',
  'New Zealand': 'NZ$',
  'NZ': 'NZ$',
  'Switzerland': 'CHF',
  'CH': 'CHF',
  'Sweden': 'kr',
  'SE': 'kr',
  'Norway': 'kr',
  'NO': 'kr',
  'Denmark': 'kr',
  'DK': 'kr',
  'Mexico': 'MX$',
  'MX': 'MX$',
  'Brazil': 'R$',
  'BR': 'R$',
  'South Korea': '₩',
  'KR': '₩',
  'Singapore': 'S$',
  'SG': 'S$',
  'Hong Kong': 'HK$',
  'HK': 'HK$',
  'Thailand': '฿',
  'TH': '฿',
  'Malaysia': 'RM',
  'MY': 'RM',
  'Indonesia': 'Rp',
  'ID': 'Rp',
  'Philippines': '₱',
  'PH': '₱',
  'Vietnam': '₫',
  'VN': '₫',
  'Turkey': '₺',
  'TR': '₺',
  'Russia': '₽',
  'RU': '₽',
  'Poland': 'zł',
  'PL': 'zł',
  'Czech Republic': 'Kč',
  'CZ': 'Kč',
  'Hungary': 'Ft',
  'HU': 'Ft',
  'South Africa': 'R',
  'ZA': 'R',
  'Israel': '₪',
  'IL': '₪',
  'UAE': 'AED',
  'AE': 'AED',
  'Saudi Arabia': 'SAR',
  'SA': 'SAR',
};

const US_STATE_ABBREVIATIONS = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

/**
 * Returns the currency symbol for a country name or ISO code.
 * Falls back to '$' when the country is unknown.
 */
export function getCurrencyFromCountry(country: string): string {
  if (!country) return '$';
  const key = country.trim();
  if (COUNTRY_CURRENCIES[key]) return COUNTRY_CURRENCIES[key];
  // Try case-insensitive match against country names / codes
  const lower = key.toLowerCase();
  for (const [name, symbol] of Object.entries(COUNTRY_CURRENCIES)) {
    if (name.toLowerCase() === lower) return symbol;
  }
  // Handle common aliases
  if (lower === 'us' || lower === 'usa' || lower === 'united states of america') return '$';
  if (lower === 'uk' || lower === 'britain' || lower === 'england') return '£';
  return '$';
}

/** Maps the same country names / codes to ISO 4217 currency codes (Stripe). */
export const COUNTRY_CURRENCY_CODES: { [key: string]: string } = {
  'US': 'USD', 'USA': 'USD', 'United States': 'USD',
  'Canada': 'CAD', 'CA': 'CAD',
  'UK': 'GBP', 'United Kingdom': 'GBP', 'GB': 'GBP',
  'EU': 'EUR', 'Germany': 'EUR', 'France': 'EUR', 'Italy': 'EUR',
  'Spain': 'EUR', 'Netherlands': 'EUR', 'Belgium': 'EUR', 'Austria': 'EUR',
  'Portugal': 'EUR', 'Greece': 'EUR', 'Ireland': 'EUR',
  'Japan': 'JPY', 'JP': 'JPY',
  'China': 'CNY', 'CN': 'CNY',
  'India': 'INR', 'IN': 'INR',
  'Australia': 'AUD', 'AU': 'AUD',
  'New Zealand': 'NZD', 'NZ': 'NZD',
  'Switzerland': 'CHF', 'CH': 'CHF',
  'Sweden': 'SEK', 'SE': 'SEK',
  'Norway': 'NOK', 'NO': 'NOK',
  'Denmark': 'DKK', 'DK': 'DKK',
  'Mexico': 'MXN', 'MX': 'MXN',
  'Brazil': 'BRL', 'BR': 'BRL',
  'South Korea': 'KRW', 'KR': 'KRW',
  'Singapore': 'SGD', 'SG': 'SGD',
  'Hong Kong': 'HKD', 'HK': 'HKD',
  'Thailand': 'THB', 'TH': 'THB',
  'Malaysia': 'MYR', 'MY': 'MYR',
  'Indonesia': 'IDR', 'ID': 'IDR',
  'Philippines': 'PHP', 'PH': 'PHP',
  'Vietnam': 'VND', 'VN': 'VND',
  'Turkey': 'TRY', 'TR': 'TRY',
  'Russia': 'RUB', 'RU': 'RUB',
  'Poland': 'PLN', 'PL': 'PLN',
  'Czech Republic': 'CZK', 'CZ': 'CZK',
  'Hungary': 'HUF', 'HU': 'HUF',
  'South Africa': 'ZAR', 'ZA': 'ZAR',
  'Israel': 'ILS', 'IL': 'ILS',
  'UAE': 'AED', 'AE': 'AED',
  'Saudi Arabia': 'SAR', 'SA': 'SAR',
};

/**
 * Returns the ISO 4217 currency code (e.g. 'USD', 'MYR') for a country name
 * or ISO code — the currency of the phone number registered at sign-up.
 * Falls back to 'USD' when the country is unknown.
 */
export function getCurrencyCodeFromCountry(country: string): string {
  if (!country) return 'USD';
  const key = country.trim();
  if (COUNTRY_CURRENCY_CODES[key]) return COUNTRY_CURRENCY_CODES[key];
  // Try case-insensitive match against country names / codes
  const lower = key.toLowerCase();
  for (const [name, code] of Object.entries(COUNTRY_CURRENCY_CODES)) {
    if (name.toLowerCase() === lower) return code;
  }
  // Handle common aliases
  if (lower === 'us' || lower === 'usa' || lower === 'united states of america') return 'USD';
  if (lower === 'uk' || lower === 'britain' || lower === 'england') return 'GBP';
  return 'USD';
}

export function getCurrencyFromAddress(address: string): string {
  if (!address) return '$';
  
  const addressUpper = address.toUpperCase();
  const addressLower = address.toLowerCase();
  
  for (const stateAbbr of US_STATE_ABBREVIATIONS) {
    const statePattern = new RegExp(`[,\\s]${stateAbbr}(?:[,\\s]|$)`);
    if (statePattern.test(addressUpper)) {
      return '$';
    }
  }
  
  const priorityChecks = [
    { pattern: /california/i, currency: '$' },
    { pattern: /united states/i, currency: '$' },
    { pattern: /\busa\b/i, currency: '$' },
    { pattern: /\bus\b/i, currency: '$' },
  ];
  
  for (const check of priorityChecks) {
    if (check.pattern.test(address)) {
      return check.currency;
    }
  }
  
  for (const [country, currency] of Object.entries(COUNTRY_CURRENCIES)) {
    if (addressLower.includes(country.toLowerCase())) {
      return currency;
    }
  }
  
  return '$';
}
