# DSR Punjab API

Express, TypeScript, Prisma and BullMQ backend for the DSR Punjab portal.

## Architecture

The source uses feature-first modules. Each business domain owns its routes,
controller, service, repository, validation and data contracts.

```text
backend/
|-- prisma/                  # schema, migrations and seed data
|-- src/
|   |-- app.ts              # Express application composition
|   |-- server.ts           # HTTP process entry point
|   |-- worker.ts           # background worker entry point
|   |-- common/             # cross-cutting errors, middleware and utilities
|   |-- config/             # typed environment configuration
|   |-- database/           # Prisma client and lifecycle
|   |-- authentication/     # identity and token verification
|   |-- authorization/      # roles, permissions and access policies
|   |-- storage/            # local/S3 storage providers
|   |-- email/              # email provider, templates and workflows
|   |-- queue/              # job HTTP interface and Redis connection
|   |-- jobs/               # queue definitions
|   `-- <domain>/           # feature-owned API layers
|-- tests/
|   `-- unit/               # fast unit and contract tests
|-- scripts/                # operational and maintenance scripts
|-- deployment/             # Docker Compose and environment examples
`-- docs/                   # architecture and deployment documentation
```

Typical request dependency flow:

```text
route -> controller -> service -> repository -> Prisma
                       |
                       `-> storage/email/queue provider
```

## Module convention

- `*.routes.ts`: endpoint and middleware wiring
- `*.controller.ts`: HTTP request/response translation
- `*.service.ts`: business rules and orchestration
- `*.repository.ts`: database access
- `*.validator.ts`: external input validation
- `*.dto.ts` / `*.types.ts`: contracts
- `*.mapper.ts`: persistence-to-API conversion
- `*.policy.ts`: authorization decisions

Keep domain-specific code inside its domain. Put code in `common/` only when it
is genuinely reusable across multiple domains. Do not recreate global `routes`,
`controllers`, or `services` folders.

## Development

```powershell
npm install
npm run prisma:generate
npm run dev
```

Run the worker separately when background jobs are needed:

```powershell
npm run dev:worker
```

## Verification

```powershell
npm test
npm run build
```

`npm run build` never changes database data. Database deployment and seeding are
intentional, separate operations:

```powershell
npm run prisma:migrate
npm run seed
```

See `docs/BACKEND_FILE_STRUCTURE.md` for detailed ownership rules.
