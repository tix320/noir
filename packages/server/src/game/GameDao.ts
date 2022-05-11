import { Dto } from "@tix320/noir-core/src/api/Dto";
import { GameInitialState } from "@tix320/noir-core/src/game/Game";
import { GameActions } from "@tix320/noir-core/src/game/GameActions";
import { assert } from "@tix320/noir-core/src/util/Assertions";
import { GameModel } from "../db/GameSchema";
import { User } from "../user/User";

export namespace GameDao {

    export async function createEmptyGame(name: string) {
        return await GameModel.create({ name: name, state: 'PREPARING' });
    }

    export async function getPlayingGames() {
        return await GameModel.find({ state: 'PLAYING' });
    }

    export async function fillInitialState(id: string, initialState: GameInitialState<User>) {

        const result = await GameModel.updateOne({ _id: id }, {
            players: initialState.players.map(player => ({ identity: player.identity.id, role: player.role.name })),
            arena: initialState.arena.map(character => character.name).raw(),
            evidenceDeck: initialState.evidenceDeck.map(character => character.name),
            actions: [],
            state: 'PLAYING'
        });

        assert(result.modifiedCount === 1, `Illegal update result ${result}`);
    }

    export async function addAction(id: string, actor: User, action: Dto.Actions.Any) {

        const result = await GameModel.updateOne({ _id: id }, {
            $push: {
                actions: {
                    actor: actor.id,
                    properties: action
                }
            }
        })

        assert(result.modifiedCount === 1, `Illegal update result ${result}`);
    }

    export async function completeGame(id: string) {
        const result = await GameModel.updateOne({ _id: id }, {
            state: 'COMPLETED'
        });

        assert(result.modifiedCount === 1, `Illegal update result ${result}`);
    }

    export async function deleteGame(id: string) {
        await GameModel.deleteOne({ _id: id });
    }
}