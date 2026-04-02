import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Bỏ qua public paths
    if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    // Kiểm tra auth cookie tồn tại
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    // Nếu đã login mà vào /login → redirect về dashboard
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match tất cả paths trừ static files, api, _next
         */
        '/((?!api|_next/static|_next/image|favicon.ico|fonts|images|logoPN|sw\\.js|manifest\\.json|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|css|js|json)$).*)',
    ],
};
