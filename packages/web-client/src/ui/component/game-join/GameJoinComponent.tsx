import { Component } from "react";
import { GamePreparationComponent } from "../game-preparation/GamePreparationComponent";
import { LobbyComponent } from "../lobby/LobbyComponent";
import React from "react";
import API from "../../../service/Api";
import { Subject, takeUntil } from "rxjs";
import { Game } from "../../../entity/Game";

type Props = {
    onGameJoin(game: Game): void
}

type State = {
    games: Array<Game>,
    selectedGame: Game
}

export class GameJoinComponent extends Component<Props, State> {

    destroy$ = new Subject();

    state: State = {
        games: [],
        selectedGame: null
    }

    componentDidMount() {
        API.gamesStream()
            .pipe(takeUntil(this.destroy$))
            .subscribe((games) => {
                this.setState({ games: Array.from(Object.values(games)) });
            });
    }

    componentWillUnmount() {
        // this.destroy$.next();
        this.destroy$.complete();
    }

    joinGame = (game) => {
        this.setState({
            selectedGame: game
        })
    }

    render() {
        const selectedGame = this.state.selectedGame;
        if (selectedGame) {
            return <GamePreparationComponent game={selectedGame} />;
        } else {
            return <LobbyComponent games={this.state.games} onGameJoin={this.joinGame} />;
        }
    }
}