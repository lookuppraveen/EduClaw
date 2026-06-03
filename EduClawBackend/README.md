# EduClaw Backend

## Test database setup

The backend test suite requires a PostgreSQL database because Prisma migrations,
repository tests, and API tests exercise the real schema.

By default, tests use:

```text
postgresql://educlaw:educlaw@localhost:5432/educlaw_test?schema=public
```

Create that local role/database, or set `TEST_DATABASE_URL` before running tests
if your local PostgreSQL credentials differ. `TEST_DATABASE_URL` is used only by
the test runner and overrides `DATABASE_URL` from `.env.test`.

To create the default role/database through an existing PostgreSQL admin
connection, set `TEST_DATABASE_ADMIN_URL` and run:

```powershell
$env:TEST_DATABASE_ADMIN_URL="postgresql://postgres:password@localhost:5432/postgres?schema=public"
npm.cmd run test:db:setup
```

`npm.cmd test` also uses `TEST_DATABASE_ADMIN_URL` when it is set: if the
configured test database is not reachable, the test runner will bootstrap the
expected role/database before running migrations.

Example:

```powershell
$env:TEST_DATABASE_URL="postgresql://user:password@localhost:5432/educlaw_test?schema=public"
npm.cmd test
```

Run the full backend verification:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```
