# Testing

## Roles (BU-021)

Automated (`backend/test/roles`; from `backend/` run `npx jest --rootDir . --modulePaths "<rootDir>"`):
- `get-roles.spec.ts`: lists roles from the repository.
- `get-role-by-id.spec.ts`: returns a role; `NotFoundException` when missing.
- `get-role-permissions.spec.ts`: returns role permissions, `[]` when none, `NotFoundException` for an unknown role (without querying permissions), deduplicates by `permission_id`.

Manual:
- Apply `database/schema.sql` twice: no errors (idempotent), comments re-applied.
- Role with no rows in `roles_permissions` returns `[]` from `getPermissionsByRoleId`.
- Unknown role id returns 404 once an HTTP controller exposes the use cases.
- Duplicate `permissions.code` or duplicate `(role_id, permission_id)` is rejected.

## JWT auth guard (BU-021)

Automated (`backend/test/auth/jwt-auth.guard.spec.ts`):
- `@Public()` route is allowed without token (`verify` not called).
- Missing `Authorization` header, non-Bearer scheme, or `verify` rejection (expired/invalid) throw `UnauthorizedException`.
- Valid token returns true, sets `request.user` to the payload, and calls `verify` with the raw token.

Manual:
- Protected endpoint without token: 401.
- Protected endpoint with expired or tampered token: 401, no internal error detail in the body.
- Protected endpoint with valid token from `/auth/login`: reaches the handler.
- `/auth/register` and `/auth/login` still reachable without token.
