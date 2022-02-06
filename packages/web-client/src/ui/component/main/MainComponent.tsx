import { Component } from "react";
import "./Main.css";
import { ProfileComponent } from "./profile/ProfileComponent";
import { GameComponent } from "../game/GameComponent";
import API from "../../../service/Api";
import { GameJoinComponent } from "../game-join/GameJoinComponent";
import React from "react";
import { Game } from "../../../entity/Game";

type Props = {
}

type State = {
    currentGame?: Game
}

export class MainComponent extends Component<Props, State> {

    state: State = {}

    componentDidMount() {
        API.getCurrentGame().then(currentGame => {
            this.setState({ currentGame })
        });
    }

    joinGame = (game) => {
        this.setState({
            currentGame: game
        })
    }

    render() {
        const currentGame = this.state.currentGame

        return (
            <div>
                <ProfileComponent id="profile" />
                {currentGame ? <GameComponent game={currentGame} /> : <GameJoinComponent onGameJoin={this.joinGame} />}
            </div>
        );
    }
}