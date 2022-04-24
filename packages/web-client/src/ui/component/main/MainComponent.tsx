import { Dto } from "@tix320/noir-core/src/api/Dto";
import classNames from "classnames";
import { Fragment, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RemoteGame } from "../../../game/RemoteGame";
import Api from "../../../service/Api";
import { StoreState } from "../../../service/Store";
import GamePreparationComponent from "../game-preparation/GamePreparationComponent";
import GameComponent from "../game/GameComponent";
import LobbyComponent from "../lobby/LobbyComponent";
import styles from "./MainComponent.module.css";
import ProfileComponent from "./profile/ProfileComponent";

type Props = {
    className?: string
}

export default function MainComponent({ className }: Props) {
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


    const profileComp = <ProfileComponent className={styles.profile} />;

    let content;
    if (currentGame) {
        if (currentGame.state === 'PREPARING') {
            const game = new RemoteGame.Preparation(currentGame.id);
            content = (
                <Fragment>
                    {profileComp}
                    <GamePreparationComponent className={styles.gamePreparation} game={game} />
                </Fragment>
            );
        } else if (currentGame.state === 'PLAYING') {
            const game = new RemoteGame.Play(currentGame.id);
            content = <GameComponent className={styles.game} game={game} identity={user!} />;
        } else {
            throw new Error(`Illegal state ${currentGame.state}`);
        }
    } else {
        content = (
            <Fragment>
                {profileComp}
                <LobbyComponent />
            </Fragment>
        );
    }

    const classnames = classNames(styles.container, className);

    return (
        <div className={classnames}>
            {content}
        </div>
    );

}