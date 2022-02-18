import { Component } from "react";
import { Game } from "../../../entity/Game";
import React from "react";
import PlayersPlaceComponent from "./PlayersPlaceComponent";
import ArenaComponent from "./ArenaComponent";
import ActionsComponent from "./ActionsComponent";

type Props = {
    game: Game
}

type State = {
}

export default class GameComponent extends Component<Props, State> {

    render() {

        return (
            <div>
                <PlayersPlaceComponent  className="mafiaSpace" hidden={true} cards={[]} />

                <ArenaComponent className="arena" />

                <ActionsComponent className="actions" />

                <PlayersPlaceComponent className="fbiSpace" hidden={false} cards={[]} />

                <div className="workingArea"></div>
            </div>
        );
    }
}