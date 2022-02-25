import Game from '@tix320/noir-core/src/dto/Game';
import React, { useEffect, useState } from 'react';
import ActionsComponent from './ActionsComponent';
import ArenaComponent from './ArenaComponent';
import PlayersPlaceComponent from './PlayersPlaceComponent';

type Props = {
    game: Game
}

export default function GameComponent(props: Props) {
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
