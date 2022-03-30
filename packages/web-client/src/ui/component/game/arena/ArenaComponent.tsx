import Game from "@tix320/noir-core/src/game/Game";
import { RoleType } from "@tix320/noir-core/src/game/RoleType";
import { Direction } from "@tix320/noir-core/src/util/Direction";
import User from "../../../../entity/User";
import RoleCard from "../../cards/role/RoleCardComponent";
import styles from './ArenaComponent.module.css';
import Shift from "./shift/ShiftComponent";


type Props = {
    className: string,
    game: Game<User>
}

export default function ArenaComponent(props: Props) {
    const { className, game } = props;

    const playersCount = game.getPlayersCount();

    const for6 = playersCount === 6;

    const arenaSize = for6 ? 6 : 7;

    const arr = [...Array(arenaSize)].map(a => a + 1);

    return (
        <div className={className}>

            <div className={styles.shiftRow}>
                {arr.map((e, i) => <Shift key={`up${i}`} direction={Direction.UP} />)}
            </div>
            {
                arr.map((e, i) =>

                    <div className={styles.suspectsRow} key={i}>
                        <Shift key={`left${i}`} direction={Direction.LEFT} />
                        {arr.map((e, i) => <RoleCard className={styles.card} key={i} role={RoleType.BOMBER} />)}
                        <Shift key={`right${i}`} direction={Direction.RIGHT} />
                    </div>
                )
            }

            <div className={styles.shiftRow}>
                {arr.map((e, i) => <Shift key={`down${i}`} direction={Direction.DOWN} />)}
            </div>

        </div>
    );
}