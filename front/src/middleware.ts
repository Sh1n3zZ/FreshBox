import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// 需要认证的路由
const protectedRoutes = ['/dashboard', '/boxes'];
// 游客路由（已登录用户不能访问）
const guestRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // 检查是否是受保护的路由
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // 检查是否是游客路由
  const isGuestRoute = guestRoutes.some(route => 
    pathname.startsWith(route)
  );

  // 如果是受保护的路由但没有token，重定向到登录页
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 如果是游客路由但已经登录，重定向到首页
  if (isGuestRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 匹配所有需要认证的路由:
     * - /dashboard 开头的路由
     * - /boxes 开头的路由
     * - /login 和 /register 路由
     */
    '/dashboard/:path*',
    '/boxes/:path*',
    '/login',
    '/register',
  ],
}; 