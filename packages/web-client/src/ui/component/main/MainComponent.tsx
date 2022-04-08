import Api from "../../../service/Api";
import RxComponent from "../common/RxComponent";
import { takeUntil } from "rxjs/operators";
import LobbyComponent from "../lobby/LobbyComponent";
import ProfileComponent from "./profile/ProfileComponent";
import styles from "./MainComponent.module.css";
import { RemoteGame } from "../../../game/RemoteGame";
import GamePreparationComponent from "../game-preparation/GamePreparationComponent";
import GameComponent from "../game/GameComponent";
import { Dto } from "@tix320/noir-core/src/api/Dto";

type State = {
    currentGame?: Dto.UserCurrentGame
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
        const currentGame = this.state.currentGame;

        let content;
        if (currentGame) {
            if (currentGame.state === 'PREPARING') {
                const game = new RemoteGame.Preparation(currentGame.id);
                content = <GamePreparationComponent game={game} />;
            } else if (currentGame.state === 'PLAYING') {
                const game = new RemoteGame.Play(currentGame.id);
                content = <GameComponent game={game} />;
            } else {
                throw new Error(`Illegal state ${currentGame.state}`);
            }
        } else {
            content = <LobbyComponent />;
        }

        return (
            <div className={styles.main}>
                <ProfileComponent className={styles.profile} />
                {content}
            </div>
        );
    }
}