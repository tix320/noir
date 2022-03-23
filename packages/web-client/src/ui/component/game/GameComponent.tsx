import Game from '@tix320/noir-core/src/game/Game';
import React from 'react';
import User from '../../../entity/User';
import ActionsComponent from './ActionsComponent';
import ArenaComponent from './ArenaComponent';
import PlayersPlaceComponent from './PlayersPlaceComponent';

type Props = {
    game: Game<User>
}

export default function GameComponent(props: Props) {
    const {game} = props;
    
    return (
        <div>
            <PlayersPlaceComponent className="mafiaSpace" hidden={true} cards={[]} />

            <ArenaComponent className="arena" />

            <ActionsComponent className="actions" />

            <PlayersPlaceComponent className="fbiSpace" hidden={false} cards={[]} />

            <div className="workingArea"></div>
        </div>
    );
}
