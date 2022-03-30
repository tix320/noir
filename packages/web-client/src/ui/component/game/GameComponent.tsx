import Game from '@tix320/noir-core/src/game/Game';
import User from '../../../entity/User';
import ArenaComponent from './arena/ArenaComponent';
import PlayersPlaceComponent from './TeamPlayersPlaceComponent';
import styles from './GameComponent.module.css';
import { useSelector } from 'react-redux';
import { StoreState } from '../../../service/Store';

type Props = {
    game: Game<User>
}

export default function GameComponent(props: Props) {
    const { game } = props;

    const mafiaTeam = game.getPlayingState().getPlayers('MAFIA');
    const fbiTeam = game.getPlayingState().getPlayers('FBI');

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
