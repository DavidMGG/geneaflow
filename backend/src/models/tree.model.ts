import mongoose, { Schema, InferSchemaType } from 'mongoose';

const collaboratorSchema = new Schema(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		role: { type: String, enum: ['viewer', 'editor', 'admin'], required: true },
		invitedBy: { type: Schema.Types.ObjectId, ref: 'User' },
		invitedAt: { type: Date, default: Date.now },
	},
	{ _id: false }
);

const treeSchema = new Schema(
	{
		ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: false, index: true },
		name: { type: String, required: true },
		description: { type: String },
		personIds: [{ type: Schema.Types.ObjectId, ref: 'Person' }],
		collaborators: [collaboratorSchema],
		visibility: { type: String, enum: ['private', 'public', 'unlisted'], default: 'private' },
		metadata: {
			generationsIndexed: { type: Number, default: 0 },
			sizeEstimate: { type: Number, default: 0 },
		},
	},
	{ timestamps: true }
);

export type TreeDocument = InferSchemaType<typeof treeSchema> & { _id: mongoose.Types.ObjectId };

export const TreeModel = mongoose.model('Tree', treeSchema);