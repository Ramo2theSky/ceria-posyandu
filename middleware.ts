import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const protectedPaths = ['/dashboard', '/input', '/daftar', '/import', '/recycle-bin'];

function isProtectedPath(pathname: string) {
  return protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function middleware(request: NextRequest) {
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });

          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/input',
    '/input/:path*',
    '/daftar',
    '/daftar/:path*',
    '/import',
    '/import/:path*',
    '/recycle-bin',
    '/recycle-bin/:path*',
  ],
};