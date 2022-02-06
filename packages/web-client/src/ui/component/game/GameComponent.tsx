import {Component} from "react";
import {UserContext} from "../../../service/UserContext";
import { Game } from "../../../entity/Game";
import React from "react";

type Props = {
    game: Game
}

type State = {
}

export class GameComponent extends Component<Props, State> {

    static contextType = UserContext

    render() {

        return (
            <div>
                <h1>Game</h1>
            </div>
        );
    }
}