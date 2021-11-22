# Teleadmin Main Backend

This folder contains main module monolith for Teleadmin.

# Stack

1. Node.js
1. TypeScript
1. CQRS
1. Event Driven Architecture
1. Knex (+ PostgreSQL)
1. GraphQL
1. 🛌 [FDD](https://github.com/Dionid/fdd-ts)
1. λ [Functional Oriented Programming (FOP)](https://github.com/Dionid/functional-oriented-programming-ts)
1. (optional) Hasura.io

# Development

1. Fork repo
1. Run at root folder:
   ```shell
   yarn
   ```
1. Copy `.env_example` to `.env` and fill it with envs
1. Run migrations:
   ```shell
   # TODO
   ```
1. Run app:
   ```shell
   yarn
   npm run dev:mgql
   ```

# Production

1. Configure your Heroku app
1. Configure your github CI/CD

# Setup

1. Create first admin
1. Authenticate
1. Create main app
1. Create main homunculus and wait for code recieve
1. Send code
1. Add new source
1. Make your homunculus admin in it
1. Request source parsing
1. Enjoy

# Roadmap

1. Main
   1. Move cmd handlers initialization to single place and make context creation and bind automatically
   1. Migrations
   1. Docker
   1. Frontend
   1. Jobs (for parsing)
   1. TX only on commands
1. Additional
   1. Add CQMeta automatically in GQL
   1. PG Event Bus -> Create separate app for cron operations
   1. Compiled SQL Queries
   1. Query
      1. N + 1 (dataloader)
      1. Complexity (https://www.apollographql.com/blog/graphql/security/securing-your-graphql-api-from-malicious-queries/)
