import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { authConfig } from "@/auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                console.log("[AUTH_DEBUG] Attempting login for:", credentials?.email);

                if (!credentials?.email || !credentials?.password) {
                    console.log("[AUTH_DEBUG] Missing credentials");
                    return null
                }

                try {
                    const user = await prisma.user.findUnique({
                        where: { email: credentials.email as string },
                    })

                    if (!user) {
                        console.log("[AUTH_DEBUG] User not found");
                        return null;
                    }

                    if (!user.password) {
                        console.log("[AUTH_DEBUG] User has no password set");
                        return null;
                    }

                    const isPasswordValid = await bcrypt.compare(
                        credentials.password as string,
                        user.password
                    )

                    if (!isPasswordValid) {
                        console.log("[AUTH_DEBUG] Invalid password");
                        return null
                    }

                    console.log("[AUTH_DEBUG] Login successful");
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        image: user.image,
                    }
                } catch (error) {
                    console.error("[AUTH_DEBUG] Error in authorize:", error);
                    return null;
                }
            },
        }),
    ],
})
