# FlowSpend + Supabase

This app now uses Supabase for authentication and database storage.

## Local Setup

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local`
3. Set your Supabase values:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_EXPENSES_TABLE=expenses
VITE_SUPABASE_ENABLE_ANON_AUTH=true
```

4. In your Supabase project, run the SQL in [supabase/schema.sql](./supabase/schema.sql)
5. If you want the app to work without a separate login screen, enable Anonymous Sign-Ins in Supabase Auth
6. Start the app:
   `npm run dev`

## Notes

- Expense records are stored in the `expenses` table.
- Row Level Security policies are included so each user only sees their own rows.
- The current app uses anonymous Supabase auth by default for a frictionless mobile-style flow.
