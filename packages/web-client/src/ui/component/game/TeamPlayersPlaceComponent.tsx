import { RoleType } from "@tix320/noir-core/src/game/RoleType";
import Identifiable from "@tix320/noir-core/src/util/Identifiable";
import GameCard from "../cards/GameCardComponent";
import RoleCard from "../cards/role/RoleCardComponent";
import styles from './TeamPlayersPlaceComponent.module.css';

type Props<I extends Identifiable> = {
    hidden: boolean,
    players: PlayerInfo<I>[],
    highlightPlayer?: I
}

export default function TeamPlayersPlaceComponent<I extends Identifiable>(props: Props<I>) {
    const players = props.players;

    return (
        <div className={styles.main}>
            {
                players.map(player => {
                    return <RoleCard key={player.identity.id} role={player.role} />
                })
            }
        </div>
    );
}

export interface PlayerInfo<I> {
    readonly identity: I;
    readonly role: RoleType;
}