import mongoose, { Schema, InferSchemaType } from 'mongoose';
import { normalizeText, tokenize } from '../utils/normalization';

const eventSchema = new Schema(
	{
		type: { type: String },
		date: { type: String },
		placeId: { type: Schema.Types.ObjectId, ref: 'Place' },
		note: { type: String },
	},
	{ _id: false }
);

const photoSchema = new Schema(
	{
		url: { type: String, required: true },
		caption: { type: String },
		uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
		storedAt: { type: String },
	},
	{ _id: false }
);

const sourceSchema = new Schema(
	{
		type: { type: String },
		referenceId: { type: String },
		description: { type: String },
	},
	{ _id: false }
);

const personSchema = new Schema(
	{
		treeId: { type: Schema.Types.ObjectId, ref: 'Tree', required: true, index: true },
		givenNames: [{ type: String }],
		familyNames: [{ type: String }],
		displayName: { type: String },
		prefixes: [{ type: String }],
		suffixes: [{ type: String }],
		sex: { type: String, enum: ['M', 'F', 'U'], default: 'U' },
		birth: { date: { type: String }, placeId: { type: Schema.Types.ObjectId, ref: 'Place' }, note: { type: String } },
		death: { date: { type: String }, placeId: { type: Schema.Types.ObjectId, ref: 'Place' }, note: { type: String } },
		otherEvents: [eventSchema],
		fatherId: { type: Schema.Types.ObjectId, ref: 'Person', default: null },
		motherId: { type: Schema.Types.ObjectId, ref: 'Person', default: null },
		partners: [{ type: Schema.Types.ObjectId, ref: 'Person' }],
		guardians: [{ type: Schema.Types.ObjectId, ref: 'Person' }],
		photos: [photoSchema],
		sources: [sourceSchema],
		notes: { type: String },
		search: {
			normalizedFullName: { type: String, index: true },
			tokens: [{ type: String, index: true }],
		},
		version: { type: Number, default: 0 },
		softDeleted: { type: Boolean, default: false },
		createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
		updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
	},
	{ timestamps: true }
);

personSchema.pre('save', function (next) {
	const full = this.displayName || [...(this.givenNames || []), ...(this.familyNames || [])].join(' ').trim();
	const normalized = normalizeText(full);
	(this as any).search = (this as any).search || {};
	(this as any).search.normalizedFullName = normalized;
	(this as any).search.tokens = tokenize(full);
	next();
});

export type PersonDocument = InferSchemaType<typeof personSchema> & { _id: mongoose.Types.ObjectId };

export const PersonModel = mongoose.model('Person', personSchema);
