import mongoose, { Schema, InferSchemaType } from 'mongoose';

const userSchema = new Schema(
	{
		email: { type: String, required: true, unique: true, index: true },
		passwordHash: { type: String, required: true },
		displayName: { type: String, required: true },
		role: { type: String, enum: ['admin', 'user'], default: 'user' },
		tfaEnabled: { type: Boolean, default: false },
		settings: {
			locale: { type: String, default: 'es' },
			dateFormat: { type: String, default: 'dd/MM/yyyy' },
			colorScheme: { type: String, default: 'warm' },
		},
	},
	{ timestamps: true }
);

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };

export const UserModel = mongoose.model('User', userSchema);
