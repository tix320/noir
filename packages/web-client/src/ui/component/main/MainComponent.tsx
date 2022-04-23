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
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { StoreState } from "../../../service/Store";

export default function MainComponent() {
    const [currentGame, setCurrentGame] = useState<Dto.UserCurrentGame | undefined>(undefined);
    const user = useSelector((state: StoreState) => state.user);

    useEffect(() => {
        const subscription = Api.myCurrentGameStream().subscribe(game => {
            setCurrentGame(game);
        })

        return () => {
            subscription.unsubscribe();
        }
    }, []);


    let content;
    if (currentGame) {
        if (currentGame.state === 'PREPARING') {
            const game = new RemoteGame.Preparation(currentGame.id);
            content = <GamePreparationComponent game={game} />;
        } else if (currentGame.state === 'PLAYING') {
            const game = new RemoteGame.Play(currentGame.id);
            content = <GameComponent game={game} identity={user!} />;
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