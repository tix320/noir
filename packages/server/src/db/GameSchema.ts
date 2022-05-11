import { Dto } from '@tix320/noir-core/src/api/Dto';
import { Character } from '@tix320/noir-core/src/game/Character';
import { GameState } from '@tix320/noir-core/src/game/Game';
import { Role } from "@tix320/noir-core/src/game/Role";
import { Schema, model, ObjectId } from 'mongoose';
import { UserModel } from './UserSchema';

interface PlayerInfo {
    identity: ObjectId,
    role: Role['name']
}

interface Action {
    actor: ObjectId,
    properties: Dto.Actions.Any
}

export interface IGame {
    name: string;
    players: PlayerInfo[],
    arena: Character['name'][][],
    evidenceDeck: Character['name'][];
    actions: Action[],
    state: GameState
}

const playerSchema = new Schema<PlayerInfo>({
    identity: { type: Schema.Types.ObjectId, ref: UserModel, required: true },
    role: { type: String, required: true }
});

const actionSchema = new Schema<Action>({
    actor: { type: Schema.Types.ObjectId, ref: UserModel, required: true },
    properties: { type: {}, required: true },
})

const gameSchema = new Schema<IGame>({
    name: { type: String, required: true },
    players: { type: [playerSchema], required: true },
    arena: { type: [[String]], required: true },
    evidenceDeck: { type: [String], required: true },
    actions: { type: [actionSchema], required: true },
    state: { type: String, required: true }
});

export const GameModel = model<IGame>('Game', gameSchema);


