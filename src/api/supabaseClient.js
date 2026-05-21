import { createClient } from '@supabase/supabase-js';

import { appConfig, supabaseConfigErrorMessage } from '@/lib/app-config';

const { url, anonKey, expensesTable, enableAnonymousAuth } = appConfig.supabase;

export const isSupabaseConfigured = Boolean(url && anonKey);
export const EXPENSES_TABLE = expensesTable;
export { supabaseConfigErrorMessage };

const createConfigError = () =>
  Object.assign(new Error(supabaseConfigErrorMessage), {
    code: 'SUPABASE_CONFIG_MISSING',
    status: 500,
  });

const createAuthRequiredError = () =>
  Object.assign(new Error('Authentication required'), {
    code: 'AUTH_REQUIRED',
    status: 401,
  });

const normalizeUser = (user) => {
  if (!user) return null;

  return {
    ...user,
    role: user.app_metadata?.role || user.user_metadata?.role || 'user',
  };
};

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

const requireSupabase = () => {
  if (!supabase) {
    throw createConfigError();
  }

  return supabase;
};

export const ensureAuthenticatedUser = async () => {
  const client = requireSupabase();

  const {
    data: { session },
    error,
  } = await client.auth.getSession();

  if (error) {
    throw error;
  }

  const user = session?.user ?? null;

  if (user) {
    return normalizeUser(user);
  }

  if (!enableAnonymousAuth) {
    throw createAuthRequiredError();
  }

  const { data, error: signInError } = await client.auth.signInAnonymously();

  if (signInError) {
    throw signInError;
  }

  const anonymousUser = data.user ?? data.session?.user ?? null;

  if (!anonymousUser) {
    throw createAuthRequiredError();
  }

  return normalizeUser(anonymousUser);
};

const parseSort = (sort = '-date') => {
  if (!sort) {
    return null;
  }

  const descending = sort.startsWith('-');
  const column = descending ? sort.slice(1) : sort;

  if (!column) {
    return null;
  }

  return {
    column,
    ascending: !descending,
  };
};

const withSupabaseError = (error) => {
  if (!error) {
    return;
  }

  if (error.code === 'PGRST205') {
    throw Object.assign(
      new Error(`Supabase table "${EXPENSES_TABLE}" is missing. Run supabase/schema.sql in the SQL Editor.`),
      {
        code: 'SUPABASE_TABLE_MISSING',
        details: error.details,
        hint: error.hint,
        status: 500,
      }
    );
  }

  throw Object.assign(new Error(error.message), {
    code: error.code,
    details: error.details,
    hint: error.hint,
    status: error.status,
  });
};

const expenseEntity = {
  async list(sort = '-date', limit = 200) {
    await ensureAuthenticatedUser();

    let query = requireSupabase().from(EXPENSES_TABLE).select('*');
    const sortOptions = parseSort(sort);

    if (sortOptions) {
      query = query.order(sortOptions.column, { ascending: sortOptions.ascending });
    }

    if (typeof limit === 'number' && limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    withSupabaseError(error);
    return data ?? [];
  },

  async filter(filters = {}, sort = '-date', limit = 200) {
    await ensureAuthenticatedUser();

    let query = requireSupabase().from(EXPENSES_TABLE).select('*');

    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }

      query = query.eq(key, value);
    });

    const sortOptions = parseSort(sort);
    if (sortOptions) {
      query = query.order(sortOptions.column, { ascending: sortOptions.ascending });
    }

    if (typeof limit === 'number' && limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    withSupabaseError(error);
    return data ?? [];
  },

  async get(id) {
    await ensureAuthenticatedUser();

    const { data, error } = await requireSupabase()
      .from(EXPENSES_TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    withSupabaseError(error);
    return data;
  },

  async create(payload) {
    const user = await ensureAuthenticatedUser();

    const { data, error } = await requireSupabase()
      .from(EXPENSES_TABLE)
      .insert({
        ...payload,
        user_id: user.id,
      })
      .select('*')
      .single();

    withSupabaseError(error);
    return data;
  },

  async update(id, payload) {
    await ensureAuthenticatedUser();

    const { data, error } = await requireSupabase()
      .from(EXPENSES_TABLE)
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    withSupabaseError(error);
    return data;
  },

  async delete(id) {
    await ensureAuthenticatedUser();

    const { error } = await requireSupabase().from(EXPENSES_TABLE).delete().eq('id', id);
    withSupabaseError(error);
    return { id };
  },
};

export const db = {
  auth: {
    async isAuthenticated() {
      const user = await ensureAuthenticatedUser();
      return Boolean(user);
    },

    async me() {
      return ensureAuthenticatedUser();
    },

    async logout(redirectUrl = '/') {
      const client = requireSupabase();
      const { error } = await client.auth.signOut();
      withSupabaseError(error);

      if (enableAnonymousAuth) {
        await ensureAuthenticatedUser();
      }

      if (typeof window !== 'undefined' && redirectUrl) {
        const nextUrl = new URL(redirectUrl, window.location.origin).toString();
        if (window.location.href !== nextUrl) {
          window.location.assign(nextUrl);
        }
      }
    },

    async redirectToLogin(redirectUrl = window.location.href) {
      await ensureAuthenticatedUser();

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

        throw new Error(`Unsupported entity "${String(entityName)}" for Supabase client.`);
      },
    }
  ),
};

export { normalizeUser };
export default db;
