export const CATEGORIES = {
  food: {
    label: 'Food & Dining',
    icon: '🍔',
    color: 'orange',
    keywords: ['restaurant', 'café', 'cafe', 'pizza', 'burger', 'swiggy', 'zomato', 'mcdonald', 'kfc', 'domino', 'food', 'dining', 'eat', 'lunch', 'dinner', 'breakfast', 'grocery', 'supermarket'],
  },
  movies: {
    label: 'Movies & Cinema',
    icon: '🎬',
    color: 'pink',
    keywords: ['cinema', 'movie', 'pvr', 'inox', 'bookmyshow', 'netflix', 'prime', 'hotstar', 'film', 'theater', 'multiplex'],
  },
  shopping: {
    label: 'Shopping',
    icon: '🛍️',
    color: 'blue',
    keywords: ['amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'shopping', 'store', 'mall', 'purchase', 'buy', 'order'],
  },
  travel: {
    label: 'Travel',
    icon: '✈️',
    color: 'indigo',
    keywords: ['uber', 'ola', 'rapido', 'irctc', 'train', 'bus', 'flight', 'airline', 'hotel', 'travel', 'cab', 'taxi', 'metro', 'auto', 'petrol', 'fuel'],
  },
  bills: {
    label: 'Bills & Utilities',
    icon: '📄',
    color: 'yellow',
    keywords: ['electricity', 'water', 'gas', 'internet', 'mobile', 'phone', 'recharge', 'dth', 'broadband', 'wifi', 'bill', 'utility', 'emi', 'loan', 'insurance'],
  },
  health: {
    label: 'Health',
    icon: '💊',
    color: 'green',
    keywords: ['hospital', 'clinic', 'doctor', 'pharmacy', 'medicine', 'health', 'medical', 'diagnostic', 'lab', 'fitness', 'gym'],
  },
  education: {
    label: 'Education',
    icon: '📚',
    color: 'teal',
    keywords: ['school', 'college', 'university', 'course', 'tuition', 'book', 'education', 'learning', 'udemy', 'coursera'],
  },
  entertainment: {
    label: 'Entertainment',
    icon: '🎮',
    color: 'purple',
    keywords: ['game', 'gaming', 'spotify', 'music', 'concert', 'event', 'entertainment', 'fun'],
  },
  other: {
    label: 'Other',
    icon: '💳',
    color: 'gray',
    keywords: [],
  },
};

export const CATEGORY_LIST = Object.entries(CATEGORIES).map(([key, val]) => ({
  value: key,
  ...val,
}));

export function detectCategory(text) {
  if (!text) return 'other';
  const lower = text.toLowerCase();
  for (const [key, config] of Object.entries(CATEGORIES)) {
    if (key === 'other') continue;
    if (config.keywords.some(kw => lower.includes(kw))) {
      return key;
    }
  }
  return 'other';
}

export function getCategoryConfig(category) {
  return CATEGORIES[category] || CATEGORIES.other;
}

export const INCOME_KEYWORDS = ['credited', 'received', 'refund', 'cashback', 'salary', 'credit', 'deposited'];