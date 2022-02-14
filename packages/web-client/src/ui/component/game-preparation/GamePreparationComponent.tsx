import { GameMode, Role } from "@tix320/noir-core";
import React from "react";
import {Component} from "react";
import { Game } from "../../../entity/Game";

type Props = {
    game: Game
}

type State = {
}

export class GamePreparationComponent extends Component<Props, State> {

    render() {
        

        return (
            <div>
                <h1>Game prepare {this.props.game.id}</h1>
               
            </div>
        );
    }

    private renderByMode(mode: GameMode, roles: Role[]){

    }
}