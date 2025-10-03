# 🚀 Guía de Despliegue en Railway

## Configuración para Railway

### 1. Variables de Entorno Requeridas

En Railway, configura estas variables de entorno:

```bash
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/geneaflow?retryWrites=true&w=majority
JWT_SECRET=tu_jwt_secret_muy_seguro_y_largo
CORS_ORIGIN=*
```

### 2. Base de Datos

**Opción A: MongoDB Atlas (Recomendado)**
1. Crea una cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crea un cluster gratuito
3. Obtén la cadena de conexión
4. Configura `MONGODB_URI` en Railway

**Opción B: Railway MongoDB**
1. En Railway, agrega el servicio MongoDB
2. Railway generará automáticamente `MONGODB_URI`

### 3. Despliegue

1. **Conecta tu repositorio** a Railway
2. **Railway detectará automáticamente** el proyecto Node.js
3. **Configura las variables de entorno** mencionadas arriba
4. **Railway ejecutará automáticamente**:
   - `npm install` (instala dependencias)
   - `npm run build` (construye frontend y backend)
   - `npm start` (inicia el servidor)

### 4. Estructura del Proyecto

```
├── package.json          # Scripts principales
├── railway.json          # Configuración de Railway
├── backend/              # API Node.js + Express
│   ├── package.json      # Dependencias del backend
│   └── src/
├── frontend/             # Vue.js SPA
│   ├── package.json      # Dependencias del frontend
│   └── src/
└── .gitignore           # Excluye node_modules y builds
```

### 5. Scripts Automáticos

- **`postinstall`**: Se ejecuta después de `npm install` y construye todo
- **`build`**: Construye backend (TypeScript → JavaScript) y frontend (Vue → HTML/CSS/JS)
- **`start`**: Inicia el servidor backend que también sirve el frontend

### 6. Verificación

Después del despliegue:
1. Visita la URL de Railway
2. Deberías ver la aplicación Vue.js
3. La API estará disponible en `/api/*`
4. El endpoint de salud en `/health`

### 7. Solución de Problemas

**Error: "No start command found"**
- ✅ Solucionado: El `package.json` raíz tiene `"start": "cd backend && npm start"`

**Error: "node_modules found in root"**
- ✅ Solucionado: El `.gitignore` excluye todos los `node_modules/`

**Error: "Build failed"**
- Verifica que todas las dependencias estén en los `package.json` correctos
- Revisa los logs de Railway para errores específicos

**Error: "Database connection failed"**
- Verifica que `MONGODB_URI` esté configurado correctamente
- Asegúrate de que la IP esté en la whitelist de MongoDB Atlas

### 8. Desarrollo Local

```bash
# Instalar todas las dependencias
npm run install-all

# Desarrollo (backend + frontend)
npm run dev

# Solo backend
cd backend && npm run dev

# Solo frontend
cd frontend && npm run dev
```
