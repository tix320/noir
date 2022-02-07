import { Component } from "react";
import { Game } from "../../../entity/Game";
import React from "react";

type Props = {
    game: Game
}

type State = {
}

export default class GameComponent extends Component<Props, State> {

    render() {

        return (
            <div>
                <h1>Game {this.props.game.mode}</h1>
            </div>
        );
    }
}