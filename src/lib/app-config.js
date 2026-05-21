const getEnvValue = (name, fallback = '') => {
  const value = import.meta.env[name];
  return typeof value === 'string' ? value.trim() : fallback;
};

export const appConfig = {
  supabase: {
    url: getEnvValue('VITE_SUPABASE_URL'),
    anonKey: getEnvValue('VITE_SUPABASE_ANON_KEY'),
    expensesTable: getEnvValue('VITE_SUPABASE_EXPENSES_TABLE', 'expenses'),
    enableAnonymousAuth: getEnvValue('VITE_SUPABASE_ENABLE_ANON_AUTH', 'true') !== 'false',
  },
};

export const supabaseConfigErrorMessage =
  'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';
