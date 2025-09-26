import { Router } from 'express';
import { PersonModel } from '../models/person.model';
import { TreeModel } from '../models/tree.model';

const router = Router();

// Ruta especial para el demo que no requiere autenticación
router.get('/trees/demo/people', async (req, res) => {
	try {
		// Buscar el árbol demo
		let demoTree = await TreeModel.findOne({ name: 'Demo' });
		
		// Si no existe, crear el árbol demo con datos de ejemplo
		if (!demoTree) {
			demoTree = await createDemoTree();
		}
		
		// Obtener las personas del árbol demo
		const persons = await PersonModel.find({ treeId: demoTree._id, softDeleted: false })
			.select('displayName fatherId motherId birth.date death.date photos sex partners')
			.limit(5000);
			
		res.json(persons.map(p => ({
			id: p.id,
			displayName: p.displayName,
			fatherId: p.fatherId,
			motherId: p.motherId,
			birthYear: p.birth?.date || null,
			deathYear: p.death?.date || null,
			hasPhoto: Array.isArray((p as any).photos) && (p as any).photos.length > 0,
			sex: (p as any).sex || 'U',
			partners: Array.isArray((p as any).partners) ? (p as any).partners : [],
		})));
	} catch (error) {
		console.error('Error en demo:', error);
		res.status(500).json({ message: 'Error cargando demo' });
	}
});

// Función para crear el árbol demo con datos de ejemplo
async function createDemoTree() {
	// Eliminar el árbol demo existente si existe
	const existingDemoTree = await TreeModel.findOne({ name: 'Demo' });
	if (existingDemoTree) {
		// Eliminar todas las personas del árbol demo
		await PersonModel.deleteMany({ treeId: existingDemoTree._id });
		// Eliminar el árbol demo
		await TreeModel.deleteOne({ _id: existingDemoTree._id });
	}
	
	// Crear el árbol demo (sin ownerId para que sea público)
	const demoTree = await TreeModel.create({
		name: 'Demo',
		description: 'Árbol genealógico de demostración',
		visibility: 'public'
	});
	
	// Crear personas de ejemplo según la nueva estructura
	const persons = [
		// Generación 1 – Padres
		{
			treeId: demoTree._id,
			displayName: 'Juan Pérez López',
			sex: 'M',
			birth: { date: '1965-01-15' }
		},
		{
			treeId: demoTree._id,
			displayName: 'María Gómez Rodríguez',
			sex: 'F',
			birth: { date: '1967-05-10' }
		},
		// Generación 2 – Hijos (3 en total)
		{
			treeId: demoTree._id,
			displayName: 'Ana Pérez Gómez',
			sex: 'F',
			birth: { date: '1990-06-14' }
		},
		{
			treeId: demoTree._id,
			displayName: 'Luis Pérez Gómez',
			sex: 'M',
			birth: { date: '1992-03-28' }
		},
		{
			treeId: demoTree._id,
			displayName: 'Carlos Pérez Gómez',
			sex: 'M',
			birth: { date: '1995-12-05' }
		},
		// Parejas de los hijos (2 en total)
		{
			treeId: demoTree._id,
			displayName: 'Pedro Martínez Ruiz',
			sex: 'M',
			birth: { date: '1989-09-22' }
		},
		{
			treeId: demoTree._id,
			displayName: 'Sofía Ramírez Torres',
			sex: 'F',
			birth: { date: '1993-11-08' }
		},
		// Generación 3 – Nietos
		{
			treeId: demoTree._id,
			displayName: 'Diego Martínez Pérez',
			sex: 'M',
			birth: { date: '2015-04-12' }
		},
		{
			treeId: demoTree._id,
			displayName: 'Valentina Pérez Ramírez',
			sex: 'F',
			birth: { date: '2018-08-20' }
		}
	];
	
	const createdPersons = await PersonModel.insertMany(persons);
	
	// Establecer relaciones familiares según la nueva estructura
	const [juan, maria, ana, luis, carlos, pedro, sofia, diego, valentina] = createdPersons;
	
	// Juan y María son pareja (Generación 1)
	juan.partners = [maria._id];
	maria.partners = [juan._id];
	await juan.save();
	await maria.save();
	
	// Ana, Luis y Carlos son hijos de Juan y María (Generación 2)
	ana.fatherId = juan._id;
	ana.motherId = maria._id;
	await ana.save();
	
	luis.fatherId = juan._id;
	luis.motherId = maria._id;
	await luis.save();
	
	carlos.fatherId = juan._id;
	carlos.motherId = maria._id;
	await carlos.save();
	
	// Ana y Pedro son pareja
	ana.partners = [pedro._id];
	pedro.partners = [ana._id];
	await ana.save();
	await pedro.save();
	
	// Luis y Sofía son pareja
	luis.partners = [sofia._id];
	sofia.partners = [luis._id];
	await luis.save();
	await sofia.save();
	
	// Diego es hijo de Ana y Pedro (Generación 3)
	diego.fatherId = pedro._id;
	diego.motherId = ana._id;
	await diego.save();
	
	// Valentina es hija de Luis y Sofía (Generación 3)
	valentina.fatherId = luis._id;
	valentina.motherId = sofia._id;
	await valentina.save();
	
	// Carlos no tiene pareja ni hijos (como se especifica)
	
	return demoTree;
}

export default router;
