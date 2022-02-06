import React from "react";
import { Component } from "react";
import { GameCard } from "./game-card/GameCard";
import _ from "lodash";
import { Game } from "../../../entity/Game";

type Props = {
    games: Array<Game>,
    onGameSelect(game: Game): void
}

type State = {
    mode: string
}

export class GameSelectionComponent extends Component<Props, State> {

    selectGame = (game)=>{
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
                    const selGame: () => void = _.curry(this.selectGame, 2)(game) as any;
                    return <GameCard key={game.id} game={game} onJoin={selGame} />
                })
                }
            </div>
        );
    }
}