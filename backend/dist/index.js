"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mountApi = mountApi;
const app_1 = require("./app");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const trees_routes_1 = __importDefault(require("./routes/trees.routes"));
const persons_routes_1 = __importDefault(require("./routes/persons.routes"));
const relationships_routes_1 = __importDefault(require("./routes/relationships.routes"));
const search_routes_1 = __importDefault(require("./routes/search.routes"));
const collaborators_routes_1 = __importDefault(require("./routes/collaborators.routes"));
const persons_read_routes_1 = __importDefault(require("./routes/persons.read.routes"));
const demo_routes_1 = __importDefault(require("./routes/demo.routes"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const auth_1 = require("./middleware/auth");
const permissions_1 = require("./middleware/permissions");
function mountApi() {
    const app = (0, app_1.createApp)();
    const api = express_1.default.Router();
    // Rutas del demo (sin autenticación)
    api.use('/', demo_routes_1.default);
    // Rutas autenticadas
    api.use('/auth', auth_routes_1.default);
    api.use('/trees', trees_routes_1.default);
    api.use('/trees/:treeId/persons', auth_1.requireAuth, (0, permissions_1.requireTreeRole)('editor'), persons_routes_1.default);
    api.use('/trees/:treeId/people', auth_1.requireAuth, (0, permissions_1.requireTreeRole)('viewer'), persons_read_routes_1.default);
    api.use('/trees/:treeId/relationships', auth_1.requireAuth, (0, permissions_1.requireTreeRole)('editor'), relationships_routes_1.default);
    api.use('/trees/:treeId/search', auth_1.requireAuth, (0, permissions_1.requireTreeRole)('viewer'), search_routes_1.default);
    api.use('/trees/:treeId/collaborators', collaborators_routes_1.default);
    app.use('/api', api);
    // Servir archivos estáticos del frontend en producción
    if (process.env.NODE_ENV === 'production') {
        const frontendPath = path_1.default.join(__dirname, '../../frontend/dist');
        app.use(express_1.default.static(frontendPath));
        // Para SPA, servir index.html para todas las rutas no-API
        app.get('*', (req, res) => {
            // Si la ruta no es de API, servir el index.html del frontend
            if (!req.path.startsWith('/api')) {
                res.sendFile(path_1.default.join(frontendPath, 'index.html'));
            }
            else {
                res.status(404).json({ error: 'Not Found' });
            }
        });
    }
    else {
        // En desarrollo, solo manejar rutas API
        app.use((_req, res) => {
            res.status(404).json({ error: 'Not Found' });
        });
    }
    return app;
}
