import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // TEMPORARY: Allow all routes for M4 UI screenshots without DB
  // if (
  //   !user &&
  //   (request.nextUrl.pathname.startsWith('/dashboard') ||
  //     request.nextUrl.pathname.startsWith('/admin') ||
  //     request.nextUrl.pathname.includes('/register'))
  // ) {
  //   const url = request.nextUrl.clone();
  //   url.pathname = '/';
  //   url.searchParams.set('login', 'true');
  //   return NextResponse.redirect(url);
  // }
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, assets, etc.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
