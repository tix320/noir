import { Dto } from "@tix320/noir-core/src/api/Dto";
import { Component } from "react";
import GameListItem from "./game-list-item/GameListItemComponent";

type Props = {
    className?:string,
    games: Array<Dto.GamePreparation>,
    onGameSelect(game: Dto.GamePreparation): void
}

type State = {
}

export default class GameSelectionComponent extends Component<Props, State> {

    selectGame = (game: Dto.GamePreparation) => {
        this.props.onGameSelect(game);
    }

    render() {
        const games = this.props.games;

        if (!games) {
            return (<h1>Games not found</h1>);
        }

        return (
            <div className={this.props.className}>
                {
                    games.map(game => {
                        return <GameListItem key={game.id} game={game} onJoin={() => this.selectGame(game)} />
                    })
                }
            </div>
        );
    }
}