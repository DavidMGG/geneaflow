# GeneaFlow — Aplicación de árboles genealógicos

Proyecto monorepo con backend (Node.js + Express + MongoDB + TypeScript) y frontend (Vue 3 + Vite + TypeScript) para crear, editar, visualizar y compartir árboles genealógicos.

## Requisitos
- Node.js 18+
- MongoDB (local o Atlas)

## Estructura
- backend: API REST (Express + Mongoose)
- frontend: SPA (Vue 3, Vite, Pinia, Vue Router)
- docs: OpenAPI y documentación

## Variables de entorno (backend)
Crea un archivo `.env` dentro de `backend/` con:
```
PORT=4000
MONGODB_URI=mongodb://localhost:27017/geneaflow
JWT_SECRET=change_this_secret
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

## Scripts
Backend:
- dev: levantar API en modo desarrollo con recarga
- build: compilar TypeScript
- start: ejecutar compilado

Frontend:
- dev: servidor de desarrollo Vite
- build: build de producción
- preview: vista previa del build

## Cómo ejecutar
1) Backend
```
cd backend
npm install
npm run dev
```
API en `http://localhost:4000`.

2) Frontend
```
cd frontend
npm install
npm run dev
```
App en `http://localhost:5173`.

## Documentación de API
Consulta `docs/openapi.yaml` (borrador inicial basado en los contratos).

## Notas
- Seguridad: JWT (access + refresh), rate limiting, Helmet, validación de entradas.
- UI: tema cálido por defecto con acentos coral/amarillo; dark mode con variables CSS.
- Validaciones clave: máx. 2 progenitores biológicos, no ciclos, coherencia de fechas (con posibilidad de override documentado).
