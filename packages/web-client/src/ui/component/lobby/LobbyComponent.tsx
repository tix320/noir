import { Button } from "react-bootstrap";
import GameCreationComponent from "./GameCreationComponent";
import GameSelectionComponent from "./GameSelectionComponent";
import API from "../../../service/Api";
import RxComponent from "../common/RxComponent";
import { takeUntil } from "rxjs/operators";
import Game from "@tix320/noir-core/src/dto/Game";

type Props = {
}

type State = {
    games: Array<Game>,
    creatingGame: boolean
}

export default class LobbyComponent extends RxComponent<Props, State> {

    state: State = {
        games: [],
        creatingGame: false,
    }

    componentDidMount(): void {
        API.gamesStream()
            .pipe(takeUntil(this.destroy$))
            .subscribe((games) => {
                this.setState({ games: Array.from(Object.values(games)) });
            });
    }

    joinGame = (game: Game) => {
        API.joinGame(game.id);
    }

    switchToGameCreation = () => {
        this.setState({
            creatingGame: true
        })
    }

    render() {
        const creatingGame = this.state.creatingGame;

        if (creatingGame) {
            return (
                <GameCreationComponent />
            );
        } else {
            return (
                <div>
                    <GameSelectionComponent games={this.state.games} onGameSelect={this.joinGame} />
                    <Button onClick={this.switchToGameCreation}> Create new game</Button>
                </div>
            );
        }


    }
}