import mongoose, { Schema, InferSchemaType } from 'mongoose';

const placeSchema = new Schema(
	{
		name: { type: String, required: true },
		countryCode: { type: String },
		lat: { type: Number },
		lng: { type: Number },
		normalizedName: { type: String, index: true },
		variants: [{ type: String }],
	},
	{ timestamps: true }
);

export type PlaceDocument = InferSchemaType<typeof placeSchema> & { _id: mongoose.Types.ObjectId };

export const PlaceModel = mongoose.model('Place', placeSchema);
