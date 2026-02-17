import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
    let response = NextResponse.next({
        request: req,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return req.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))

                    response = NextResponse.next({
                        request: req,
                    })

                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user && req.nextUrl.pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    if (
        user &&
        (req.nextUrl.pathname.startsWith('/login') ||
            req.nextUrl.pathname.startsWith('/signup'))
    ) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return response
}

export const config = {
    matcher: ['/dashboard/:path*', '/login', '/signup'],
}
