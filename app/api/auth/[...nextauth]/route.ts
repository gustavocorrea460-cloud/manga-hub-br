import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"

const config: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/",
  },
}

export const { handlers: { GET, POST }, auth } = NextAuth(config)
