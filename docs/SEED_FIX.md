# MissingGreenlet Seed Fix

## Error

```
MissingGreenlet: greenlet_spawn has not been called; can't call await_only() here
```

## Cause

Async SQLAlchemy forbids **implicit lazy loads** on relationships outside an async greenlet context.

The old seed did:

```python
role.permissions.append(perm)   # may lazy-load role.permissions
user.roles.append(admin_role)   # may lazy-load user.roles
await db.refresh(role, attribute_names=["permissions"])
```

That triggers `MissingGreenlet` on Neon/Render (asyncpg).

## Fix

1. **Association tables only** — insert `RolePermission` / `UserRole` rows by ID; never mutate `.permissions` / `.roles` collections in seed.
2. **Column-only SELECTs** — `select(Role.id)`, `select(Permission.id)`, etc.
3. **Dedicated session** for `POST /api/v1/admin/seed` with its own `commit()`.
4. **`lazy="selectin"`** on User/Role/Permission relationships for safer runtime access.
5. **Signup** also uses `UserRole` insert instead of `user.roles.append`.

## After deploy

```bash
curl -X POST https://royal-rail-restro-api.onrender.com/api/v1/admin/seed \
  -H "X-Seed-Secret: YOUR_SEED_SECRET"
```

Success example:

```json
{
  "success": true,
  "categories": 12,
  "menu_items": 28,
  "users": 1,
  "seed_stats": { "admin_created": true, ... }
}
```

Verify:

```bash
curl https://royal-rail-restro-api.onrender.com/api/v1/admin/db-stats
curl https://royal-rail-restro-api.onrender.com/api/v1/home | head -c 500
```

Login:

- Email: `admin@royalrailrestro.com` (or your `ADMIN_EMAIL`)
- Password: value of `ADMIN_PASSWORD` on Render
