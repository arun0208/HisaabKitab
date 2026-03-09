import { VoiceCommand, VoiceCommandType } from '../types';

// Hindi number words mapped to digits
const HINDI_NUMBERS: Record<string, number> = {
  'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'paanch': 5,
  'chhe': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'das': 10,
  'gyarah': 11, 'barah': 12, 'terah': 13, 'chaudah': 14, 'pandrah': 15,
  'solah': 16, 'satrah': 17, 'athaarah': 18, 'unees': 19, 'bees': 20,
  'pachees': 25, 'tees': 30, 'pachas': 50, 'sau': 100,
  'do sau': 200, 'teen sau': 300, 'char sau': 400, 'paanch sau': 500,
  'hazaar': 1000, 'hazar': 1000,
};

// Keywords that indicate credit intent (shop gave goods on credit to someone, or supplier gave credit to shop)
const CREDIT_KEYWORDS = [
  'udhaar', 'udhar', 'credit', 'likh', 'likho', 'likha',
  'khata', 'hisaab', 'de do', 'dedo', 'udhaar likh',
  'likh do', 'likhdo', 'likh de', 'likhde',
];

// Keywords that indicate payment intent
const PAYMENT_KEYWORDS = [
  'diye', 'diya', 'diye hai', 'diya hai', 'paid', 'payment',
  'bhugtan', 'jama', 'de diye', 'de diya', 'mil gaye', 'mil gaya',
  'received', 'wapas', 'waapas', 'chuka', 'chukaya',
];

// Keywords that indicate stock/inventory intent
const STOCK_KEYWORDS = [
  'add karo', 'stock', 'jodo', 'jod do', 'add', 'inventory',
  'packet', 'piece', 'pieces', 'kg', 'kilo', 'liter', 'litre',
  'box', 'dozen', 'maal', 'saman', 'samaan',
];

// Words to strip from name extraction
const NOISE_WORDS = new Set([
  'ko', 'ka', 'ki', 'ke', 'ne', 'se', 'me', 'hai', 'hain',
  'karo', 'kro', 'karaye', 'do', 'de', 'dedo', 'kar', 'likh', 'likho',
  'the', 'for', 'to', 'of', 'in', 'a', 'an', 'is', 'was',
  'rupees', 'rupay', 'rupaye', 'rupiya', 'rs', 'please', 'krdo',
  'udhaar', 'udhar', 'credit', 'payment', 'paid', 'jama',
  'add', 'stock', 'jodo', 'diye', 'diya', 'bhugtan',
  'liter', 'litre', 'packet', 'piece', 'pieces', 'kg', 'kilo',
  'box', 'dozen', 'maal', 'saman', 'samaan', 'inventory',
  'wapas', 'waapas', 'chuka', 'chukaya',
  'mil', 'gaye', 'gaya', 'received',
]);

/**
 * Extract all numbers from a text string (both digits and Hindi number words).
 */
function extractNumbers(text: string): number[] {
  const numbers: number[] = [];

  // Extract digit-based numbers
  const digitMatches = text.match(/\d+/g);
  if (digitMatches) {
    for (const m of digitMatches) {
      numbers.push(parseInt(m, 10));
    }
  }

  // Extract Hindi number words
  const lowerText = text.toLowerCase();
  for (const [word, value] of Object.entries(HINDI_NUMBERS)) {
    if (lowerText.includes(word)) {
      // avoid double counting if the Hindi word maps to same value as a digit already found
      if (!numbers.includes(value)) {
        numbers.push(value);
      }
    }
  }

  return numbers;
}

/**
 * Determine the intent from the voice text.
 */
function detectIntent(text: string): VoiceCommandType | null {
  const lowerText = text.toLowerCase();

  // Check payment first (more specific)
  for (const keyword of PAYMENT_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return 'add_payment';
    }
  }

  // Check credit
  for (const keyword of CREDIT_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return 'add_credit';
    }
  }

  // Check stock
  for (const keyword of STOCK_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return 'add_stock';
    }
  }

  return null;
}

/**
 * Extract a name from the text by removing known keywords, numbers, and noise words.
 */
function extractName(text: string): string {
  let cleaned = text.toLowerCase();

  // Remove numbers (digits)
  cleaned = cleaned.replace(/\d+/g, '');

  // Remove Hindi number words
  for (const word of Object.keys(HINDI_NUMBERS)) {
    cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
  }

  // Split into words and filter out noise
  const words = cleaned.split(/\s+/).filter((w) => {
    const trimmed = w.trim();
    return trimmed.length > 0 && !NOISE_WORDS.has(trimmed);
  });

  // The remaining words should be the name — capitalize first letter of each
  const name = words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .trim();

  return name;
}

/**
 * Fuzzy match a name against a list of known names.
 * Returns the best match if similarity is above a threshold.
 */
export function fuzzyMatch(input: string, candidates: string[]): string | null {
  if (!input || candidates.length === 0) return null;

  const inputLower = input.toLowerCase();
  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const candidateLower = candidate.toLowerCase();

    // Exact match
    if (inputLower === candidateLower) return candidate;

    // Starts with
    if (candidateLower.startsWith(inputLower) || inputLower.startsWith(candidateLower)) {
      const score =
        0.8 +
        (Math.min(inputLower.length, candidateLower.length) /
          Math.max(inputLower.length, candidateLower.length)) *
        0.2;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = candidate;
      }
    }

    // Contains
    if (candidateLower.includes(inputLower) || inputLower.includes(candidateLower)) {
      const score = 0.7 * Math.min(inputLower.length, candidateLower.length) / Math.max(inputLower.length, candidateLower.length);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = candidate;
      }
    }

    // Levenshtein-based similarity for short names
    if (inputLower.length <= 15 && candidateLower.length <= 15) {
      const distance = levenshtein(inputLower, candidateLower);
      const maxLen = Math.max(inputLower.length, candidateLower.length);
      const similarity = 1 - distance / maxLen;
      if (similarity > bestScore && similarity > 0.5) {
        bestScore = similarity;
        bestMatch = candidate;
      }
    }
  }

  return bestScore >= 0.4 ? bestMatch : null;
}

/**
 * Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

/**
 * Parse a voice transcript into a structured command.
 *
 * @param transcript - The raw text from speech recognition
 * @param customerNames - Known customer names for fuzzy matching
 * @param productNames - Known product names for fuzzy matching
 * @returns Parsed VoiceCommand or null if unable to parse
 */
export function parseVoiceCommand(
  transcript: string,
  customerNames: string[] = [],
  productNames: string[] = [],
): VoiceCommand | null {
  if (!transcript || transcript.trim().length === 0) return null;

  const text = transcript.trim();
  const intent = detectIntent(text);
  if (!intent) return null;

  const numbers = extractNumbers(text);
  const extractedName = extractName(text);

  if (!extractedName) return null;

  if (intent === 'add_stock') {
    // For stock: match against products, quantity is the number
    const matchedProduct = fuzzyMatch(extractedName, productNames) || extractedName;
    return {
      type: 'add_stock',
      name: matchedProduct,
      quantity: numbers[0] || 1,
    };
  }

  // For credit/payment: match against customers, amount is the number
  const matchedCustomer = fuzzyMatch(extractedName, customerNames) || extractedName;
  return {
    type: intent,
    name: matchedCustomer,
    amount: numbers[0] || 0,
  };
}
