import { config } from 'dotenv'
import type { Knex } from 'knex'

if (process.env.NODE_ENV === 'test') {
  config({ path: '.env.test' })
} else {
  config({ path: '.env' })
}

const configKnex: Knex.Config = {
  client: process.env.DATABASE_CLIENT || 'sqlite',
  connection:
    process.env.DATABASE_CLIENT === 'sqlite'
      ? {
          filename: process.env.DATABASE_URL || './db/app.db',
        }
      : process.env.DATABASE_URL || '',
  useNullAsDefault: true,
  migrations: {
    extension: 'ts',
    directory: './db/migrations',
  },
}

export default configKnex
