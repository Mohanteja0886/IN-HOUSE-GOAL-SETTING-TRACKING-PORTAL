import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { MockSupabaseClient } from './mockClient';

export const createClient = async () => {
  const cookieStore = await cookies();

  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                 process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-ref') ||
                 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'your-anon-key';

  if (isMock) {
    const cookieStr = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
    return new MockSupabaseClient(cookieStr) as any;
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored if called from a Server Component where cookies cannot be set dynamically.
          }
        },
      },
    }
  );
};
