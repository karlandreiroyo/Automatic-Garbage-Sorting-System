# NextAuth Configuration Example

## Complete NextAuth Config with Google OAuth + Credentials

Here's the corrected configuration that combines both providers:

```typescript
import { NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { verify } from "@node-rs/argon2";
import { db } from "./lib/db"; // Your database connection
import { accounts } from "./lib/schema"; // Your database schema
import { eq, or } from "drizzle-orm";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

export const authOptions: NextAuthOptions = {
	providers: [
		Google({
			clientId: GOOGLE_CLIENT_ID,
			clientSecret: GOOGLE_CLIENT_SECRET,
		}),
		Credentials({
			id: 'credentials',
			name: 'Credentials',
			credentials: {
				user: { label: 'Email or Contact Number', type: 'text' },
				password: { label: 'Password', type: 'password' }
			},
			async authorize(credentials) {
				if (!credentials?.user || !credentials?.password) {
					return null;
				}

				const user = credentials.user as string;
				const password = credentials.password as string;

				try {
					// Find user by email or contact number
					const [foundUser] = await db
						.select()
						.from(accounts)
						.where(
							or(
								eq(accounts.email, user),
								eq(accounts.contacts, user)
							)
						)
						.limit(1);

					// User not found
					if (!foundUser) {
						return null;
					}

					// Check if user registered with OAuth (no password)
					if (!foundUser.password) {
						throw new Error('This account uses social login. Please sign in with Google.');
					}

					// Verify password
					const validPassword = await verify(foundUser.password, password, {
						memoryCost: 19456,
						timeCost: 2,
						outputLen: 32,
						parallelism: 1
					});

					if (!validPassword) {
						return null;
					}

					// Return user object for JWT
					return {
						id: foundUser.id.toString(),
						email: foundUser.email,
						name: `${foundUser.firstname} ${foundUser.lastname}`.trim()
					};
				} catch (error) {
					console.error('Authorization error:', error);
					return null;
				}
			}
		})
	],
	// Add callbacks to handle both providers
	callbacks: {
		async signIn({ user, account, profile }) {
			// Handle Google OAuth sign in
			if (account?.provider === 'google') {
				// You can add logic here to create/update user in your database
				// if they sign in with Google for the first time
				return true;
			}
			// Handle credentials sign in
			if (account?.provider === 'credentials') {
				return true;
			}
			return true;
		},
		async jwt({ token, user, account }) {
			// Initial sign in
			if (user) {
				token.id = user.id;
				token.email = user.email;
				token.name = user.name;
			}
			return token;
		},
		async session({ session, token }) {
			// Add user data to session
			if (session.user) {
				session.user.id = token.id as string;
				session.user.email = token.email as string;
				session.user.name = token.name as string;
			}
			return session;
		}
	},
	pages: {
		signIn: '/auth/signin', // Custom sign in page
	},
	session: {
		strategy: 'jwt',
	},
	secret: process.env.NEXTAUTH_SECRET,
};
```

## Key Fixes Made:

1. **Fixed syntax error**: Changed `name: ${foundUser.firstname} ${foundUser.lastname}.trim()` to `name: \`${foundUser.firstname} ${foundUser.lastname}\`.trim()`

2. **Corrected imports**: 
   - `GoogleProvider` → `Google`
   - `CredentialsProvider` → `Credentials`

3. **Added proper callbacks** for handling both authentication methods

## Required Dependencies:

```bash
npm install next-auth @node-rs/argon2 drizzle-orm
```

## Environment Variables:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

## Note:

This configuration is for a **Next.js project with NextAuth**. 

If you're working with the **Automatic Garbage Sorting System** project (which uses Supabase Auth), you would need to integrate Google OAuth differently through Supabase's authentication system instead.
