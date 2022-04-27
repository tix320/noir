import { Schema, model } from 'mongoose';

export interface IUser {
    name: string;
    token: string;
}

const userSchema = new Schema<IUser>({
    name: { type: String, required: true  },
    token: { type: String, required: true,  },
});

export const UserModel = model<IUser>('User', userSchema);

