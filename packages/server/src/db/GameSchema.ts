import { Character } from '@tix320/noir-core/src/game/Character';
import { Role } from "@tix320/noir-core/src/game/Role";
import { Schema, model } from 'mongoose';
import { UserModel } from './UserSchema';

interface PlayerInfo {
    identity: string,
    role: Role['name']
}

interface Action {
    actor: string,
    properties: object
}

interface IGame {
    name: string;
    players: PlayerInfo[],
    arena: Character['name'][][],
    evidenceDeck: Character['name'][];
    actions: Action[]
}

const playerSchema = new Schema<PlayerInfo>({
    identity: { type: Schema.Types.ObjectId, ref: UserModel, required: true },
    role: { type: String, required: true }
});

const actionSchema = new Schema<Action>({
    actor: { type: Schema.Types.ObjectId, ref: UserModel, required: true },
    properties: {}
})

const gameSchema = new Schema<IGame>({
    name: { type: String, required: true },
    players: [playerSchema],
    arena: { type: [[String]], required: true },
    evidenceDeck: { type: [String], required: true },
    actions: [actionSchema]
});

export const GameModel = model<IGame>('Game', gameSchema);


