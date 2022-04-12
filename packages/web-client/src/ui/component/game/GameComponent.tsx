import { filterPlayersByTeam, InitialState } from '@tix320/noir-core/src/game/Game';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { from, mergeMap } from 'rxjs';
import User from '../../../entity/User';
import { RemoteGame } from '../../../game/RemoteGame';
import { StoreState } from '../../../service/Store';
import ArenaComponent from './arena/ArenaComponent';
import styles from './GameComponent.module.css';
import PlayersPlaceComponent from './TeamPlayersPlaceComponent';

type Props = {
    game: RemoteGame.Play
}

export default function GameComponent(props: Props) {
    const { game } = props;

    const [initialState, setInitialState] = useState<InitialState<User> | undefined>(undefined);

    useEffect(() => {
        const subscription = from(game.fetchInitialState())
            .pipe(mergeMap(() => {
                setInitialState(game.initialState);
                return game.events();
            }))
            .subscribe((event) => {
                console.log(event);
            });;

        return () => {
            subscription.unsubscribe();
        }
    }, [game]);

    const user = useSelector((state: StoreState) => state.user)!;

    return (
        <div className={styles.main}>

            {initialState &&
                <div className={styles.upper}>
                    <PlayersPlaceComponent hidden={true} players={filterPlayersByTeam(game, 'MAFIA')} highlightPlayer={user} />

                    <ArenaComponent className={styles.arena} arena={initialState.arena} />

                    <PlayersPlaceComponent hidden={false} players={filterPlayersByTeam(game, 'FBI')} highlightPlayer={user} />
                </div>
            }

            <div className={styles.footer} >

            </div>
        </div>
    );
}