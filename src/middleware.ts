import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const host = request.headers.get('host') || ''

  // ✅ ALLOW LOCALHOST TO STAY HTTP
  const isLocalhost =
    host.includes('localhost') ||
    host.startsWith('127.0.0.1')

  // ✅ FORCE CUSTOM DOMAIN IN PRODUCTION
  if (!isLocalhost && host.includes('vercel.app')) {
    url.hostname = 'prosperityhub.app'
    url.protocol = 'https:'
    return NextResponse.redirect(url, 301)
  }

  // ✅ REMOVE WWW
  if (!isLocalhost && host.startsWith('www.prosperityhub.app')) {
    url.hostname = 'prosperityhub.app'
    url.protocol = 'https:'
    return NextResponse.redirect(url, 301)
  }

  // ✅ FORCE HTTPS ONLY IN PRODUCTION
  if (!isLocalhost && url.protocol === 'http:') {
    url.protocol = 'https:'
    return NextResponse.redirect(url, 301)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}