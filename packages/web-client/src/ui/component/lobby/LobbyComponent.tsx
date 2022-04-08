import { Button } from "react-bootstrap";
import '@tix320/noir-core/src/extension/ArrayExtension';
import GameCreationComponent from "./GameCreationComponent";
import GameSelectionComponent from "./GameSelectionComponent";
import API from "../../../service/Api";
import RxComponent from "../common/RxComponent";
import { takeUntil } from "rxjs/operators";
import { Dto } from "@tix320/noir-core/src/api/Dto";

type Props = {
}

type State = {
    games: Array<Dto.GamePreparation>,
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
            .subscribe((game) => {
                this.setState(prevState => {
                    prevState.games.removeFirstBy(g => g.id === game.id);
                    const games = [...prevState.games, game];
                    return { games: games };
                })
            });
    }

    joinGame = (game: Dto.GamePreparation) => {
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