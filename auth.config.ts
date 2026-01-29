import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    trustHost: true,
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
            }
            return session
        },
    },
    providers: [], // Providers are added in lib/auth.ts
} satisfies NextAuthConfig
