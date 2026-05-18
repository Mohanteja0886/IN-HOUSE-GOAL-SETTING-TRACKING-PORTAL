import { createBrowserClient } from '@supabase/ssr';
import { MockSupabaseClient } from './mockClient';

export const createClient = () => {
  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                 process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-ref') ||
                 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'your-anon-key';

  if (isMock) {
    return new MockSupabaseClient() as any;
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

