import mongoose, { Schema, InferSchemaType } from 'mongoose';

const relationshipSchema = new Schema(
	{
		treeId: { type: Schema.Types.ObjectId, ref: 'Tree', required: true, index: true },
		type: { type: String, enum: ['biological_parent', 'adoptive_parent', 'partner', 'guardian', 'other'], required: true },
		fromId: { type: Schema.Types.ObjectId, ref: 'Person', required: true, index: true },
		toId: { type: Schema.Types.ObjectId, ref: 'Person', required: true, index: true },
		startDate: { type: String },
		endDate: { type: String },
		attributes: { primary: { type: Boolean, default: false }, note: { type: String } },
		overrideReason: { type: String }, // Motivo para override de validaciones (ej: edad implausible)
		createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
	},
	{ timestamps: true }
);

export type RelationshipDocument = InferSchemaType<typeof relationshipSchema> & { _id: mongoose.Types.ObjectId };

export const RelationshipModel = mongoose.model('Relationship', relationshipSchema);
