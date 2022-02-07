import { Component } from "react";
import { GamePreparationComponent } from "../game-preparation/GamePreparationComponent";
import { LobbyComponent } from "../lobby/LobbyComponent";
import React from "react";
import API from "../../../service/Api";
import { Subject, takeUntil } from "rxjs";
import { Game } from "../../../entity/Game";
import { GameState } from "@tix320/noir-core";
import { connect } from "react-redux";
import store, { currentGameChanged } from "../../../service/Store";

type Props = {
    currentGame: Game
}

type State = {
    games: Array<Game>,
}

class GameJoinComponent extends Component<Props, State> {

    destroy$ = new Subject();

    state: State = {
        games: [],
    }

    componentDidMount() {
        API.gamesStream()
            .pipe(takeUntil(this.destroy$))
            .subscribe((games) => {
                this.setState({ games: Array.from(Object.values(games)) });
            });
    }

    componentWillUnmount() {
        this.destroy$.next(null);
        this.destroy$.complete();
    }

    joinGame = (game: Game) => {
        store.dispatch(currentGameChanged(game));
    }

    render() {
        const currentGame = this.props.currentGame

        if (currentGame && currentGame.state === GameState.PREPARING) {
            return <GamePreparationComponent game={currentGame} />;
        } else {
            return <LobbyComponent games={this.state.games} onGameJoin={this.joinGame} />;
        }
    }
}

function mapStateToProps(state) {
    const currentGame = state.currentGame;
    return {
        currentGame,
    };
}

export default connect(mapStateToProps)(GameJoinComponent);