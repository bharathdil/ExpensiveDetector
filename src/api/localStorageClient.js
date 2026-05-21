const EXPENSES_STORAGE_KEY = 'flowspend.expenses';
const LOCAL_USER_STORAGE_KEY = 'flowspend.localUser';

const createLocalUser = () => ({
  id: 'local-user',
  email: 'local@flowspend.app',
  role: 'user',
  app_metadata: { provider: 'localStorage' },
  user_metadata: { name: 'Local User' },
});

const readJson = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;

  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const readExpenses = () => readJson(EXPENSES_STORAGE_KEY, []);
const writeExpenses = (expenses) => writeJson(EXPENSES_STORAGE_KEY, expenses);

const normalizeExpense = (payload) => {
  const now = new Date().toISOString();

  return {
    id: payload.id || `expense-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    amount: Number(payload.amount) || 0,
    type: payload.type || 'expense',
    category: payload.category || 'other',
    merchant: payload.merchant || '',
    note: payload.note || '',
    location: payload.location || '',
    date: payload.date || now,
    source: payload.source || 'manual',
    raw_message: payload.raw_message || '',
    sms_id: payload.sms_id || '',
    sms_sender: payload.sms_sender || '',
    sms_date: payload.sms_date || null,
    user_id: 'local-user',
    created_date: payload.created_date || now,
    updated_date: payload.updated_date || now,
  };
};

const parseSort = (sort = '-date') => {
  if (!sort) return null;
  const descending = sort.startsWith('-');
  const column = descending ? sort.slice(1) : sort;
  return column ? { column, direction: descending ? -1 : 1 } : null;
};

const compareValues = (a, b) => {
  if (a === b) return 0;
  if (a === undefined || a === null) return -1;
  if (b === undefined || b === null) return 1;

  const aDate = typeof a === 'string' ? Date.parse(a) : NaN;
  const bDate = typeof b === 'string' ? Date.parse(b) : NaN;

  if (!Number.isNaN(aDate) && !Number.isNaN(bDate)) {
    return aDate - bDate;
  }

  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  return String(a).localeCompare(String(b));
};

const sortAndLimit = (items, sort, limit) => {
  const sortOptions = parseSort(sort);
  const result = [...items];

  if (sortOptions) {
    result.sort((a, b) => compareValues(a[sortOptions.column], b[sortOptions.column]) * sortOptions.direction);
  }

  return typeof limit === 'number' && limit > 0 ? result.slice(0, limit) : result;
};

export const normalizeUser = (user) => {
  if (!user) return null;

  return {
    ...user,
    role: user.app_metadata?.role || user.user_metadata?.role || user.role || 'user',
  };
};

export const ensureAuthenticatedUser = async () => {
  const storedUser = readJson(LOCAL_USER_STORAGE_KEY, null);
  const user = normalizeUser(storedUser || createLocalUser());
  writeJson(LOCAL_USER_STORAGE_KEY, user);
  return user;
};

const expenseEntity = {
  async list(sort = '-date', limit = 200) {
    await ensureAuthenticatedUser();
    return sortAndLimit(readExpenses(), sort, limit);
  },

  async filter(filters = {}, sort = '-date', limit = 200) {
    await ensureAuthenticatedUser();

    const filtered = readExpenses().filter((expense) =>
      Object.entries(filters).every(([key, value]) => {
        if (value === undefined || value === null || value === '') return true;
        return expense[key] === value;
      })
    );

    return sortAndLimit(filtered, sort, limit);
  },

  async get(id) {
    await ensureAuthenticatedUser();
    return readExpenses().find((expense) => expense.id === id) || null;
  },

  async create(payload) {
    await ensureAuthenticatedUser();
    const expense = normalizeExpense(payload);
    const expenses = readExpenses();
    writeExpenses([expense, ...expenses]);
    return expense;
  },

  async update(id, payload) {
    await ensureAuthenticatedUser();

    const now = new Date().toISOString();
    let updatedExpense = null;
    const expenses = readExpenses().map((expense) => {
      if (expense.id !== id) return expense;
      updatedExpense = normalizeExpense({ ...expense, ...payload, id, updated_date: now });
      return updatedExpense;
    });

    writeExpenses(expenses);
    return updatedExpense;
  },

  async delete(id) {
    await ensureAuthenticatedUser();
    writeExpenses(readExpenses().filter((expense) => expense.id !== id));
    return { id };
  },

  async clear() {
    await ensureAuthenticatedUser();
    writeExpenses([]);
    return [];
  },
};

export const db = {
  auth: {
    async isAuthenticated() {
      return Boolean(await ensureAuthenticatedUser());
    },

    async me() {
      return ensureAuthenticatedUser();
    },

    async logout(redirectUrl = '/') {
      writeJson(LOCAL_USER_STORAGE_KEY, createLocalUser());

      if (typeof window !== 'undefined' && redirectUrl) {
        const nextUrl = new URL(redirectUrl, window.location.origin).toString();
        if (window.location.href !== nextUrl) {
          window.location.assign(nextUrl);
        }
      }
    },

    async redirectToLogin(redirectUrl = window.location.href) {
      if (typeof window !== 'undefined' && redirectUrl) {
        const nextUrl = new URL(redirectUrl, window.location.origin).toString();
        if (window.location.href !== nextUrl) {
          window.location.assign(nextUrl);
        }
      }
    },
  },

  entities: new Proxy(
    {},
    {
      get(_target, entityName) {
        if (entityName === 'Expense') {
          return expenseEntity;
        }

        throw new Error(`Unsupported entity "${String(entityName)}" for localStorage client.`);
      },
    }
  ),
};

export default db;
