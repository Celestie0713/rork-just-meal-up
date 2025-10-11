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
