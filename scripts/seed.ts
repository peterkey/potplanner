import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { drizzle } from 'drizzle-orm/node-postgres'
import { users } from '../src/lib/db/schema'

// Do NOT import 'server-only' here — this script runs standalone via tsx, not in Next.js

async function seed() {
  const email = process.env.HOUSEHOLD_EMAIL
  const password = process.env.HOUSEHOLD_PASSWORD

  if (!email || !password) {
    console.error('Missing required env vars: HOUSEHOLD_EMAIL, HOUSEHOLD_PASSWORD')
    process.exit(1)
  }

  if (!process.env.DATABASE_URL) {
    console.error('Missing required env var: DATABASE_URL')
    process.exit(1)
  }

  const db = drizzle(process.env.DATABASE_URL)

  console.log(`Seeding household user: ${email}`)

  const passwordHash = await bcrypt.hash(password, 12)

  await db
    .insert(users)
    .values({ email, passwordHash })
    .onConflictDoUpdate({
      target: users.email,
      set: { passwordHash },
    })

  console.log('Household user upserted successfully.')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
