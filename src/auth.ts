import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!user?.passwordHash || !user.isActive) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        if (!user.emailVerified) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
    ...(googleEnabled
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google' || !user.email) return true;
      const email = user.email.toLowerCase();
      const existing = await prisma.user.findUnique({ where: { email }, select: { isActive: true } });
      if (existing && !existing.isActive) return false;
      await prisma.user.upsert({
        where: { email },
        update: {
          emailVerified: new Date(),
          googleId: account.providerAccountId,
        },
        create: {
          email,
          name: user.name || email,
          googleId: account.providerAccountId,
          emailVerified: new Date(),
          role: 'USER',
        },
      });
      return true;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === 'google') {
        const email = String(user?.email || token.email || '').toLowerCase();
        const dbUser = await prisma.user.findUnique({ where: { email } });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.email = dbUser.email;
        }
        return token;
      }
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      if (token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: String(token.id) },
          select: { role: true },
        });
        if (fresh) token.role = fresh.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
});
