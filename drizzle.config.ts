import type { Config } from 'drizzle-kit'
import * as dotenv from 'dotenv'
dotenv.config()

export default {
  schema: './backend/drizzle/schema.ts',
  out: './backend/drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './nidarshan.db',
  },
} satisfies Config
