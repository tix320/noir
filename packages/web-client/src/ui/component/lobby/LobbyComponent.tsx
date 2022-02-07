import React from "react";
import { Component } from "react";
import { Button } from "react-bootstrap";
import { Game } from "../../../entity/Game";
import { GameCreationComponent } from "./GameCreationComponent";
import { GameSelectionComponent } from "./GameSelectionComponent";
import API from "../../../service/Api";

type Props = {
    games: Array<Game>,
    onGameJoin(game: Game): void
}

type State = {
    creatingGame: boolean
}

export class LobbyComponent extends Component<Props, State> {

    state: State = {
        creatingGame: false
    }

    joinGame = (game: Game) => {
       
        API.joinGame(game.id, false).then(() => this.props.onGameJoin(game));
    }

    createGame = () => {
        this.setState({
            creatingGame: true
        })
    }

    render() {
        const creatingGame = this.state.creatingGame;

        if (creatingGame) {
            return (
                <GameCreationComponent onGameCreate={this.joinGame} />
            );
        } else {
            return (
                <div>
                    <GameSelectionComponent games={this.props.games} onGameSelect={this.joinGame} />
                    <Button onClick={this.createGame}> Create new game</Button>
                </div>
            );
        }


    }
}