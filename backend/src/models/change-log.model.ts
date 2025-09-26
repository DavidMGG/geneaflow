import mongoose, { Schema, InferSchemaType } from 'mongoose';

const changeLogSchema = new Schema(
	{
		entityType: { type: String, enum: ['Person', 'Relationship', 'Tree'], required: true },
		entityId: { type: Schema.Types.ObjectId, required: true, index: true },
		operation: { type: String, enum: ['create', 'update', 'delete', 'merge', 'revert'], required: true },
		changes: { type: Schema.Types.Mixed },
		performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
		reason: { type: String },
	},
	{ timestamps: { createdAt: 'performedAt', updatedAt: false } }
);

export type ChangeLogDocument = InferSchemaType<typeof changeLogSchema> & { _id: mongoose.Types.ObjectId };

export const ChangeLogModel = mongoose.model('ChangeLog', changeLogSchema);
