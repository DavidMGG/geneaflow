import 'dotenv/config';
import mongoose from 'mongoose';
import { TreeModel } from '../models/tree.model';
import { PersonModel } from '../models/person.model';

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/geneaflow';

async function initDemo() {
	try {
		await mongoose.connect(mongoUri);
		console.log('MongoDB conectado');

		// Verificar si ya existe el árbol demo
		let demoTree = await TreeModel.findOne({ name: 'Demo' });
		
		if (demoTree) {
			console.log('Árbol demo ya existe, eliminando datos anteriores...');
			// Eliminar personas existentes del demo
			await PersonModel.deleteMany({ treeId: demoTree._id });
		} else {
			console.log('Creando árbol demo...');
			// Crear el árbol demo (sin ownerId para que sea público)
			demoTree = await TreeModel.create({
				name: 'Demo',
				description: 'Árbol genealógico de demostración',
				visibility: 'public'
			});
		}
		
		console.log('Creando personas de ejemplo...');
		
		// Crear personas de ejemplo
		const persons = [
			// Generación 1 (abuelos)
			{
				treeId: demoTree._id,
				displayName: 'Juan Pérez',
				sex: 'M',
				birth: { date: '1920-01-15' },
				death: { date: '1995-03-20' }
			},
			{
				treeId: demoTree._id,
				displayName: 'María García',
				sex: 'F',
				birth: { date: '1925-05-10' },
				death: { date: '2000-08-15' }
			},
			{
				treeId: demoTree._id,
				displayName: 'Carlos López',
				sex: 'M',
				birth: { date: '1918-12-03' },
				death: { date: '1992-11-25' }
			},
			{
				treeId: demoTree._id,
				displayName: 'Ana Martínez',
				sex: 'F',
				birth: { date: '1922-07-18' },
				death: { date: '1998-04-12' }
			},
			// Generación 2 (padres)
			{
				treeId: demoTree._id,
				displayName: 'Pedro Pérez García',
				sex: 'M',
				birth: { date: '1950-09-22' },
				death: { date: '2020-01-10' }
			},
			{
				treeId: demoTree._id,
				displayName: 'Carmen López Martínez',
				sex: 'F',
				birth: { date: '1955-11-08' }
			},
			// Generación 3 (hijos)
			{
				treeId: demoTree._id,
				displayName: 'Luis Pérez López',
				sex: 'M',
				birth: { date: '1980-06-14' }
			},
			{
				treeId: demoTree._id,
				displayName: 'Sofia Pérez López',
				sex: 'F',
				birth: { date: '1985-03-28' }
			},
			{
				treeId: demoTree._id,
				displayName: 'Miguel Pérez López',
				sex: 'M',
				birth: { date: '1990-12-05' }
			}
		];
		
		const createdPersons = await PersonModel.insertMany(persons);
		
		// Establecer relaciones familiares
		const [juan, maria, carlos, ana, pedro, carmen, luis, sofia, miguel] = createdPersons;
		
		// Pedro es hijo de Juan y María
		pedro.fatherId = juan._id;
		pedro.motherId = maria._id;
		await pedro.save();
		
		// Carmen es hija de Carlos y Ana
		carmen.fatherId = carlos._id;
		carmen.motherId = ana._id;
		await carmen.save();
		
		// Pedro y Carmen son pareja
		pedro.partners = [carmen._id];
		carmen.partners = [pedro._id];
		await pedro.save();
		await carmen.save();
		
		// Luis, Sofia y Miguel son hijos de Pedro y Carmen
		luis.fatherId = pedro._id;
		luis.motherId = carmen._id;
		await luis.save();
		
		sofia.fatherId = pedro._id;
		sofia.motherId = carmen._id;
		await sofia.save();
		
		miguel.fatherId = pedro._id;
		miguel.motherId = carmen._id;
		await miguel.save();
		
		console.log('✅ Demo inicializado correctamente');
		console.log(`Árbol ID: ${demoTree._id}`);
		console.log(`Personas creadas: ${createdPersons.length}`);
		
	} catch (error) {
		console.error('❌ Error inicializando demo:', error);
	} finally {
		await mongoose.disconnect();
		process.exit(0);
	}
}

initDemo();
