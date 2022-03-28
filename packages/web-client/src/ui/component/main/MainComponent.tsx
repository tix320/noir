import GameComponent from "../game/GameComponent";
import Api from "../../../service/Api";
import RxComponent from "../common/RxComponent";
import { takeUntil } from "rxjs/operators";
import GamePreparationComponent from "../game-preparation/GamePreparationComponent";
import { LobbyComponent } from "../lobby/LobbyComponent";
import ProfileComponent from "./profile/ProfileComponent";
import styles from "./Main.module.css";
import Game from "@tix320/noir-core/src/dto/Game";
import RemoteGame from "../../../game/RemoteGame";

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
            const game = new RemoteGame(currentGame.id);
            if (currentGame.state === 'PREPARING') {
                content = <GamePreparationComponent game={game} />;
            } else {
                content = <GameComponent game={game} />;
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