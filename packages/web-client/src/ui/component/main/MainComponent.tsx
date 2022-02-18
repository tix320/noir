import GameComponent from "../game/GameComponent";
import { GameState } from "@tix320/noir-core";
import { Game } from "../../../entity/Game";
import Api from "../../../service/Api";
import RxComponent from "../common/RxComponent";
import { takeUntil } from "rxjs";
import GamePreparationComponent from "../game-preparation/GamePreparationComponent";
import { LobbyComponent } from "../lobby/LobbyComponent";
import ProfileComponent from "./profile/ProfileComponent";
import styles from "./Main.module.css";

type State = {
    currentGame?: Game
}

export default class MainComponent extends RxComponent<{}, State> {

    state: State = {}

    componentDidMount(): void {
        Api.myCurrentGameStream().pipe(takeUntil(this.destroy$)).subscribe(game => {
            this.setState({
                currentGame: game
            })
        })
    }

    render() {
        const currentGame = this.state.currentGame

        let content;
        if (currentGame) {
            if (currentGame.state === GameState.PREPARING) {
                content = <GamePreparationComponent game={currentGame} />;
            } else {
                content = <GameComponent game={currentGame} />;
            }
        } else {
            content = <LobbyComponent />;
        }

        return (
            <div>
                <ProfileComponent className={styles.profile} />
                {content}
            </div>
        );
    }
}