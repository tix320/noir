import { Component } from "react";
import "./Main.css";
import ProfileComponent from "./profile/ProfileComponent";
import GameComponent from "../game/GameComponent";
import GameJoinComponent from "../game-join/GameJoinComponent";
import React from "react";
import { GameState } from "@tix320/noir-core";
import { connect } from "react-redux";
import { Game } from "../../../entity/Game";

type Props = {
    currentGame: Game
}

type State = {
}

class MainComponent extends Component<Props, State> {

    state: State = {}

    render() {
        const currentGame = this.props.currentGame

        return (
            <div>
                <ProfileComponent id="profile" />
                {currentGame && currentGame.state === GameState.PLAYING ? <GameComponent game={currentGame} /> : <GameJoinComponent />}
            </div>
        );
    }
}

function mapStateToProps(state) {
    const currentGame = state.currentGame;
    return {
        currentGame,
    };
}

export default connect(mapStateToProps)(MainComponent);