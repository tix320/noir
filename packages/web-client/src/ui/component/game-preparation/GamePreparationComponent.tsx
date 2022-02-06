import {Component} from "react";
import { Game } from "../../../entity/Game";

type Props = {
    game: Game
}

type State = {
}

export class GamePreparationComponent extends Component<Props, State> {

    constructor(props) {
        super(props);
    }

    render() {

        return (
            <div>
                <h1>Game prepare {this.props.game.id}</h1>
            </div>
        );
    }
}