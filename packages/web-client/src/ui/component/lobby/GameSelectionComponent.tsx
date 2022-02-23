import Game from "@tix320/noir-core/src/dto/Game";
import React from "react";
import { Component } from "react";
import { GameCard } from "./game-card/GameCard";

type Props = {
    games: Array<Game>,
    onGameSelect(game: Game): void
}

type State = {
}

export class GameSelectionComponent extends Component<Props, State> {

    selectGame = (game: Game) => {
        this.props.onGameSelect(game);
    }

    render() {
        const games = this.props.games;

        if (!games) {
            return (<h1>Games not found</h1>);
        }

        return (
            <div>
                <h1>Games</h1>
                {
                    games.map(game => {
                        return <GameCard key={game.id} game={game} onJoin={() => this.selectGame(game)} />
                    })
                }
            </div>
        );
    }
}