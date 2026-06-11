# VALUX

Sitio de VALUX migrado a **Next.js (App Router)** con autenticación (**Auth.js**) y plataforma de cursos (**Prisma + PostgreSQL**), desplegado en Vercel.

## Estructura

- `public/` — el sitio original (HTML/CSS/JS) se sirve **sin ningún cambio visual**. Los rewrites de `next.config.mjs` mantienen las clean URLs (`/que-es`, `/contacto`, etc.).
- `src/app/` — rutas nuevas:
  - `/registro` y `/login` — crear cuenta e iniciar sesión (email + contraseña).
  - `/cursos` — catálogo de cursos; `/cursos/[slug]` — detalle e inscripción; `/cursos/[slug]/[leccion]` — contenido (solo usuarios inscritos).
  - `/api/register` — alta de usuarios; `/api/auth/*` — Auth.js.
- `prisma/schema.prisma` — modelos `User`, `Course`, `Lesson`, `Enrollment`.

## Configuración

1. Crear una base PostgreSQL (en Vercel: Storage → Postgres/Neon).
2. Variables de entorno (ver `.env.example`):
   - `DATABASE_URL` — conexión a Postgres.
   - `AUTH_SECRET` — generar con `npx auth secret`.
3. Crear las tablas y datos de ejemplo:

```bash
npm install
npm run db:push   # crea las tablas
npm run db:seed   # curso de ejemplo (opcional)
npm run dev
```

## Despliegue en Vercel

Vercel detecta Next.js automáticamente. Solo hay que configurar `DATABASE_URL` y `AUTH_SECRET` en *Project Settings → Environment Variables*. El comando de build (`prisma generate && next build`) ya está en `package.json`.
