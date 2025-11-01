import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl

  // current host, e.g. "excess-capacity-git-main-lholmes274-specs-projects.vercel.app"
  const host = request.headers.get('host') || ''

  // ✅ Redirect .vercel.app → prosperityhub.app
  if (host.includes('vercel.app')) {
    url.hostname = 'prosperityhub.app'
    return NextResponse.redirect(url, 301)
  }

  // ✅ Redirect www.prosperityhub.app → prosperityhub.app
  if (host.startsWith('www.prosperityhub.app')) {
    url.hostname = 'prosperityhub.app'
    return NextResponse.redirect(url, 301)
  }

  // ✅ Force HTTPS (optional)
  if (url.protocol === 'http:') {
    url.protocol = 'https:'
    return NextResponse.redirect(url, 301)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'], // Apply to all routes except static assets
}
