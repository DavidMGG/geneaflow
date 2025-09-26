import 'dotenv/config';
import mongoose from 'mongoose';
import { mountApi } from './index';

const port = Number(process.env.PORT || 4000);
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/geneaflow';

async function start() {
	try {
		await mongoose.connect(mongoUri);
		console.log('MongoDB conectado');

		const app = mountApi();
		app.listen(port, () => {
			console.log(`API escuchando en http://localhost:${port}`);
		});
	} catch (error) {
		console.error('Error iniciando servidor', error);
		process.exit(1);
	}
}

start();
