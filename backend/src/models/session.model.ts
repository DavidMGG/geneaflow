import mongoose, { Schema, InferSchemaType } from 'mongoose';

const sessionSchema = new Schema(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		jti: { type: String, required: true, unique: true, index: true },
		userAgent: { type: String },
		ip: { type: String },
		revokedAt: { type: Date, default: null },
	},
	{ timestamps: { createdAt: true, updatedAt: false } }
);

export type SessionDocument = InferSchemaType<typeof sessionSchema> & { _id: mongoose.Types.ObjectId };

export const SessionModel = mongoose.model('Session', sessionSchema);
