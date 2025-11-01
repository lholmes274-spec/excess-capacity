import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const host = request.headers.get('host') || ''

  if (host.includes('vercel.app')) {
    url.hostname = 'prosperityhub.app'
    return NextResponse.redirect(url, 301)
  }

  if (host.startsWith('www.prosperityhub.app')) {
    url.hostname = 'prosperityhub.app'
    return NextResponse.redirect(url, 301)
  }

  if (url.protocol === 'http:') {
    url.protocol = 'https:'
    return NextResponse.redirect(url, 301)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}
