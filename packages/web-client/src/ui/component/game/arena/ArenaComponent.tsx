import { Dto } from "@tix320/noir-core/src/api/Dto";
import { Arena } from "@tix320/noir-core/src/game/Game";
import { RoleType } from "@tix320/noir-core/src/game/RoleType";
import { Direction } from "@tix320/noir-core/src/util/Direction";
import RoleCard from "../../cards/role/RoleCardComponent";
import styles from './ArenaComponent.module.css';
import Shift from "./shift/ShiftComponent";


type Props = {
    className: string,
    arena: Arena
}

export default function ArenaComponent(props: Props) {
    const { className, arena } = props;

    const arenaSize = arena.size;

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