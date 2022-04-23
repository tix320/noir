import { Character } from "@tix320/noir-core/src/game/Character";
import { Role } from "@tix320/noir-core/src/game/Role";
import Identifiable, { equals } from "@tix320/noir-core/src/util/Identifiable";
import RoleCard from "../cards/role/RoleCardComponent";
import styles from './TeamPlayersPanelComponent.module.css';

type Props<I extends Identifiable> = {
    className?: string,
    hidden: boolean,
    players: PlayerInfo<I>[],
    alert: I[],
    me?: I,
    currentTurn?: I,
}

export default function TeamPlayersPanelComponent<I extends Identifiable>(props: Props<I>) {
    const players = props.players;

    return (
        <div className={`${props.className} ${styles.main}`}>
            {
                players.map(player => {
                    const alert = props.alert.some(alertPlayer => equals(player.identity, alertPlayer));
                    const highlight = alert || player.identity.id === props.currentTurn?.id;
                    const customHighlightClassName = alert ? styles.alert : undefined;
                    const myClassName = equals(player.identity, props.me) ? styles.me : undefined;

                    return <RoleCard key={player.identity.id}
                        character={props.hidden ? undefined : player.character}
                        role={player.role}
                        highlight={highlight}
                        additionalClassName={myClassName}
                        additionalHighLightClassName={customHighlightClassName} />
                })
            }
        </div>
    );
}

export interface PlayerInfo<I> {
    readonly identity: I;
    readonly character: Character;
    readonly role: Role;
}