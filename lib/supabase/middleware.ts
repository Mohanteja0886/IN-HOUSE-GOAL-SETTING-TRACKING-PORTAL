import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { MockSupabaseClient } from './mockClient';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                 process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-ref') ||
                 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'your-anon-key';

  let supabase;

  if (isMock) {
    const cookieStr = request.cookies.getAll().map(c => `${c.name}=${c.value}`).join('; ');
    supabase = new MockSupabaseClient(cookieStr) as any;
  } else {
    supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );
  }

  // Refresh session if needed
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protect all non-auth and dashboard routes
  if (
    !user &&
    pathname !== '/login' &&
    !pathname.startsWith('/_next') &&
    pathname !== '/favicon.ico' &&
    pathname !== '/'
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect already authenticated users away from the login screen
  if (user && (pathname === '/login' || pathname === '/')) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'Employee';
    const url = request.nextUrl.clone();
    
    if (role === 'Admin') {
      url.pathname = '/admin/dashboard';
    } else if (role === 'Manager') {
      url.pathname = '/manager/dashboard';
    } else {
      url.pathname = '/employee/dashboard';
    }
    
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
