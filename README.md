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

## Ejecutar desde cero despues de clonar

### 1. Instalar prerrequisitos

Cada integrante debe tener instalado:

- Git
- Node.js 20 o superior
- pnpm
- Docker Desktop

En Windows o macOS, Docker Desktop debe estar abierto antes de ejecutar comandos de Docker. Basta con abrir la aplicacion Docker Desktop y esperar a que indique que el motor esta corriendo. En Linux normalmente alcanza con tener activo el servicio Docker.

Si `pnpm` no esta instalado, se puede activar con Corepack:

```bash
corepack enable
corepack prepare pnpm@10.14.0 --activate
```

### 2. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd compra_inteligente
```

### 3. Instalar dependencias

```bash
pnpm install
```

### 4. Crear el archivo de entorno

```bash
cp .env.example .env
```

En PowerShell, si `cp` no esta disponible:

```powershell
Copy-Item .env.example .env
```

El `.env.example` ya esta preparado para usar PostgreSQL por Docker en `localhost:5433`.

### 5. Abrir Docker Desktop y levantar PostgreSQL

Antes de ejecutar este paso, abrir Docker Desktop y esperar a que el motor este iniciado.

```bash
docker compose up -d postgres
```

Para verificar que el contenedor esta corriendo:

```bash
docker compose ps
```

PostgreSQL se expone en `localhost:5433` para evitar conflictos con una instalacion local en el puerto 5432.

### 6. Preparar Prisma y la base de datos

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

El seed crea usuarios de desarrollo, clientes, vehiculos y productos financieros de ejemplo.

### 7. Instalar navegador de Playwright para pruebas e2e

```bash
pnpm exec playwright install chromium
```

Este paso solo es necesario una vez por maquina, o cuando Playwright lo vuelva a pedir.

### 8. Ejecutar la aplicacion

```bash
pnpm dev
```

Abrir la app en:

```text
http://localhost:3000
```

Usuarios de desarrollo creados por el seed:

- `admin` / `Admin123!`
- `asesor` / `Asesor123!`

Estas credenciales son solo para entorno local y no deben publicarse en produccion.

## Comandos utiles

Levantar la base de datos:

```bash
docker compose up -d postgres
```

Detener la base de datos:

```bash
docker compose down
```

Reiniciar datos locales desde migraciones y seed:

```bash
pnpm db:migrate
pnpm db:seed
```

Ejecutar la app:

```bash
pnpm dev
```

## Scripts

- `pnpm lint`: ejecuta ESLint.
- `pnpm typecheck`: valida TypeScript sin emitir archivos.
- `pnpm test`: ejecuta pruebas unitarias e integracion con Vitest.
- `pnpm test:e2e`: ejecuta pruebas end-to-end con Playwright.
- `pnpm build`: compila la aplicacion Next.js.

## Documentacion del dominio

- Reglas de negocio: `docs/business-rules.md`
- Casos de prueba: `docs/test-cases.md`
- Informe de referencia: `docs/reference/Informe_01 (1).pdf`
