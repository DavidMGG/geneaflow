"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = require("./index");
const port = Number(process.env.PORT || 4000);
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/geneaflow';
async function start() {
    try {
        await mongoose_1.default.connect(mongoUri);
        console.log('MongoDB conectado');
        const app = (0, index_1.mountApi)();
        app.listen(port, () => {
            console.log(`API escuchando en http://localhost:${port}`);
        });
    }
    catch (error) {
        console.error('Error iniciando servidor', error);
        process.exit(1);
    }
}
start();
