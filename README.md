# Compra Inteligente

Aplicacion web full-stack para simular creditos vehiculares en Peru bajo la modalidad de Compra Inteligente.

## Stack

- Next.js con TypeScript, App Router y carpeta `src`
- pnpm
- Tailwind CSS
- PostgreSQL con Prisma ORM
- Zod, React Hook Form, Decimal.js y bcrypt
- Vitest y Playwright
- Docker Compose para la base de datos

## Primeros pasos

1. Instalar dependencias:

```bash
pnpm install
```

2. Crear el archivo de entorno:

```bash
cp .env.example .env
```

3. Levantar PostgreSQL:

```bash
docker compose up -d
```

4. Generar el cliente de Prisma:

```bash
pnpm db:generate
```

5. Ejecutar la aplicacion:

```bash
pnpm dev
```

La aplicacion queda disponible en `http://localhost:3000`. PostgreSQL se expone en `localhost:5433` para evitar conflictos con instalaciones locales.

## Scripts

- `pnpm lint`: ejecuta ESLint.
- `pnpm typecheck`: valida TypeScript sin emitir archivos.
- `pnpm test`: ejecuta pruebas unitarias e integracion con Vitest.
- `pnpm test:e2e`: ejecuta pruebas end-to-end con Playwright.
- `pnpm build`: compila la aplicacion Next.js.

## Documentacion del dominio

- Reglas de negocio: `docs/business-rules.md`
- Casos de prueba pendientes: `docs/test-cases.md`
- Informe de referencia: `docs/reference/Informe_01 (1).pdf`
