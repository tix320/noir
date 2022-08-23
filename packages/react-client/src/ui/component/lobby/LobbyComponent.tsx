import { Dto } from "@tix320/noir-core/src/api/Dto";
import { onFirst } from "@tix320/noir-core/src/extension/RxJSExtension";
import { API } from "@tix320/noir-web-client-core";
import { Fragment, useState } from "react";
import { Button } from "react-bootstrap";
import { useServerConnectedEffect } from "../common/Hooks";
import GameCreationComponent from "./GameCreationComponent";
import GameSelectionComponent from "./GameSelectionComponent";
import styles from "./LobbyComponent.module.css";
import OnlineCountComponent from "./onlineCountComponent/OnlineCountComponent";

type Props = {
}

export default function LobbyComponent(props: Props) {

    const [games, setGames] = useState<Dto.GamePreparation[]>([]);
    const [creatingGame, setCreatingGame] = useState<boolean>(false);

    useServerConnectedEffect(() => {
        const subscription = API.allPreparingGamesStream()
            .pipe(
                onFirst((games: Dto.GamePreparation[]) => {
                    setGames(games);
                }))
            .subscribe((game) => {
                setGames(prevGames => {
                    prevGames.removeFirstBy(g => g.id === game.id);
                    const games = [...prevGames, game];
                    return games;
                })
            });

        return () => {
            subscription.unsubscribe();
        }
    }, []);

    const joinGame = (game: Dto.GamePreparation) => {
        API.joinGame(game.id);
    }

    const switchToGameCreation = () => {
        setCreatingGame(true);
    }

    let content;

    if (creatingGame) {
        content = (<GameCreationComponent />);
    } else {
        content = (
            <div>
                <GameSelectionComponent className={styles.gameSelectionPanel} games={games} onGameSelect={joinGame} />
                <Button className={styles.createGameButton} onClick={switchToGameCreation}> Create new game</Button>
            </div>
        );
    }

    return (
        <Fragment>
            <OnlineCountComponent className={styles.onlineCountPanel} refreshMillis={5000} />
            {content}
        </Fragment>
    )
}