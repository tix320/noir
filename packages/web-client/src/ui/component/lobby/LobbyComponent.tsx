import { Dto } from "@tix320/noir-core/src/api/Dto";
import { onFirst } from "@tix320/noir-core/src/extension/RxJSExtension";
import { useState } from "react";
import { Button } from "react-bootstrap";
import API from "../../../service/Api";
import { useServerConnectedEffect } from "../common/Hooks";
import GameCreationComponent from "./GameCreationComponent";
import GameSelectionComponent from "./GameSelectionComponent";
import styles from "./LobbyComponent.module.css";

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

    if (creatingGame) {
        return (
            <GameCreationComponent />
        );
    } else {
        return (
            <div>
                <GameSelectionComponent className={styles.gameSelectionPanel} games={games} onGameSelect={joinGame} />
                <Button className={styles.createGameButton} onClick={switchToGameCreation}> Create new game</Button>
            </div>
        );
    }


}