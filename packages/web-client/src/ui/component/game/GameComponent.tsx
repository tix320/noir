import { Game } from '@tix320/noir-core/src/game/Game';
import { useSelector } from 'react-redux';
import User from '../../../entity/User';
import { StoreState } from '../../../service/Store';
import ArenaComponent from './arena/ArenaComponent';
import styles from './GameComponent.module.css';
import PlayersPlaceComponent from './TeamPlayersPlaceComponent';

type Props = {
    game: Game.Play<User>
}

export default function GameComponent(props: Props) {
    const { game } = props;

    const mafiaTeam = game.getPlayersOfTeam('MAFIA');
    const fbiTeam = game.getPlayersOfTeam('FBI');

    const user = useSelector((state: StoreState) => state.user)!;

    // const myPlayer = game.getPlayingState().players.find(player => player.identity.id === user.id);

    return (
        <div className={styles.main}>

            <div className={styles.upper}>
                <PlayersPlaceComponent hidden={true} players={mafiaTeam} highlightPlayer={user} />

                <ArenaComponent className={styles.arena} game={game} />

                <PlayersPlaceComponent hidden={false} players={fbiTeam} highlightPlayer={user} />
            </div>

            <div className={styles.footer} >

            </div>
        </div>
    );
}
