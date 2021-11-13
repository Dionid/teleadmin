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

# Roadmap

1. Main
   1. Add CQMeta automatically in GQL
   1. Migrations
   1. Docker
   1. Frontend
   1. Jobs (for parsing)
   1. TX only on commands
1. Additional
   1. PG Event Bus -> Cron separate app
   1. Compiled SQL Queries
   1. Query
      1. N + 1 (dataloader)
      1. Complexity (https://www.apollographql.com/blog/graphql/security/securing-your-graphql-api-from-malicious-queries/)
   1. Separate projection into different files and remove services
