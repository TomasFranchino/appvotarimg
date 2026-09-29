# Expectativa vs. Realidad · Votación

App para que la clase vote sus 3 trabajos favoritos (3, 2 y 1 punto) desde el celular.

- **Galería** (`/`): cada trabajo con sus 2 imágenes lado a lado. Tocar una imagen la amplía.
- **Votación**: modal donde se eligen 1º, 2º y 3º lugar. Un voto por navegador (fingerprint + cookie).
- **Resultados** (`/resultados`): ranking en vivo (se actualiza cada 5 s). Desempate: más 1º lugares, luego más 2º.
- **Ya votaste** (`/ya-votaste`): confirma el voto y muestra lo que elegiste.
- **Panel del profe** (`/admin`): subir trabajos desde el celular, eliminar trabajos, ver y borrar votos, abrir/cerrar la votación y ocultar los resultados hasta el final.

Stack: Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Prisma + Postgres (Neon) · Vercel Blob · FingerprintJS.

---

## Desplegar en Vercel (unos 10 minutos)

1. **Subí el proyecto a GitHub** (repo nuevo, puede ser privado).
2. En [vercel.com/new](https://vercel.com/new) importá el repo. Todavía no hagas deploy, o si ya lo hiciste, no pasa nada.
3. En el proyecto de Vercel → pestaña **Storage**:
   - **Create Database → Neon (Postgres)** → conectarla al proyecto. Crea `DATABASE_URL` y `DATABASE_URL_UNPOOLED`.
   - **Create → Blob** → elegí acceso **Public** → conectarlo al proyecto. Crea `BLOB_READ_WRITE_TOKEN`.
4. **Settings → Environment Variables** → agregá `ADMIN_PASSWORD` con la clave que quieras.
5. **Deployments → Redeploy.** El build crea las tablas solo (`prisma db push`, en el script `vercel-build`).
6. Entrá a `https://tu-app.vercel.app/admin`, iniciá sesión y subí los trabajos.

> Consejo: antes de la clase hacé un voto de prueba y borralo desde el panel ("Votos → Borrar todos").

## Desarrollo local

```bash
npm install
npx vercel link          # vincula la carpeta al proyecto de Vercel
npx vercel env pull .env # baja las variables (Prisma lee .env)
npm run db:push          # crea las tablas si todavía no existen
npm run dev
```

La subida de imágenes funciona en local porque el navegador sube directo a Vercel Blob.

## Cómo funciona el "un voto por persona"

Cada navegador genera un identificador con FingerprintJS; la base tiene `fingerprint` único, así que el mismo
navegador no puede votar dos veces. Además se guarda una cookie con el id del voto, por si el fingerprint cambia.

Es suficiente para una clase, pero no es infalible:

- Alguien que cambie de navegador o de celular puede volver a votar.
- **Dos celulares idénticos** (mismo modelo y versión, sobre todo iPhone) pueden generar el mismo fingerprint.
  El segundo verá "Ya votaste" sin haber votado. Es una limitación de la versión gratuita de FingerprintJS.

## Estructura

```
prisma/schema.prisma          Work, Ballot, VoteItem, Settings
src/app/page.tsx              Galería
src/app/resultados/           Ranking
src/app/ya-votaste/           Confirmación
src/app/admin/                Panel del profe
src/app/api/vote/             POST voto · status
src/app/api/results/          GET ranking
src/app/api/admin/*           login, upload (token de Blob), works, ballots, settings
src/components/               Galería, modal de voto, resultados, panel
src/components/ui/            Componentes shadcn/ui
```
