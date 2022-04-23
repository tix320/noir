import { Arena, Marker, ShiftAction, Suspect } from "@tix320/noir-core/src/game/Game";
import { GameHelper } from "@tix320/noir-core/src/game/GameHelper";
import { Direction } from "@tix320/noir-core/src/util/Direction";
import Position from "@tix320/noir-core/src/util/Position";
import SuspectCard from "../../cards/suspect/SuspectCardComponent";
import styles from './ArenaComponent.module.css';
import Shift from "./shift/ShiftComponent";

type Props = {
    className: string,
    arena: Arena,
    fastShift: boolean,
    disableShift: boolean,
    lastShift?: ShiftAction,
    meHighlight?: Position,
    teamHighlight?: Position[],
    supportHighlight?: Position[],
    supportHighlightMarkers?: Map<string, Marker[]>,
    onShift(direction: Direction, index: number, fast: boolean): void,
    onSuspectClick(position: Position, suspect: Suspect): void,
    onMarkerClick(position: Position, suspect: Suspect, marker: Marker): void,
}

export default function ArenaComponent(props: Props) {
    const { className, arena, disableShift, lastShift, teamHighlight, supportHighlight, supportHighlightMarkers, onShift, onSuspectClick, onMarkerClick } = props;
    console.log(lastShift);

    const isReverseShift = (direction: Direction, index: number) => {
        return !!lastShift && GameHelper.isReverseShifts({ direction: direction, index: index }, lastShift);
    }

    const arenaSize = arena.size;
    const arr = [...Array(arenaSize)].map(a => a + 1);
    return (
        <div className={`${className} ${styles.main}`}>
            <div className={styles.shiftRow}>
                {arr.map((e, index) => <Shift key={`up${index}`}
                    direction={Direction.UP}
                    disabled={disableShift || isReverseShift(Direction.UP, index)}
                    fast={props.fastShift}
                    onAction={(fast) => onShift(Direction.UP, index, fast)} />)}
            </div>
            {
                arr.map((e, row) =>
                    <div className={styles.suspectsRow} key={row}>
                        <Shift key={`left${row}`}
                            direction={Direction.LEFT}
                            disabled={disableShift || isReverseShift(Direction.LEFT, row)}
                            fast={props.fastShift}
                            onAction={(fast) => onShift(Direction.LEFT, row, fast)} />

                        {arr.map((e, column) => <SuspectCard key={column}
                            suspect={arena.at(row, column)}
                            highlight={supportHighlight?.some(pos => pos.x === row && pos.y === column)}
                            additionalClassName={props.meHighlight?.x === row && props.meHighlight?.y === column ?
                                styles.mySuspect
                                : teamHighlight?.some(pos => pos.x === row && pos.y === column) ? styles.teamSuspect : undefined}
                            highlightMarkers={supportHighlightMarkers?.get(new Position(row, column).toString())}
                            onSuspectClick={suspect => onSuspectClick(new Position(row, column), suspect)}
                            onMarkerClick={(suspect, marker) => onMarkerClick(new Position(row, column), suspect, marker)} />)}

                        <Shift key={`right${row}`}
                            direction={Direction.RIGHT}
                            disabled={disableShift || isReverseShift(Direction.RIGHT, row)}
                            fast={props.fastShift}
                            onAction={(fast) => onShift(Direction.RIGHT, row, fast)} />
                    </div>
                )
            }

            <div className={styles.shiftRow}>
                {arr.map((e, index) => <Shift key={`down${index}`}
                    direction={Direction.DOWN}
                    disabled={disableShift || isReverseShift(Direction.DOWN, index)}
                    fast={props.fastShift}
                    onAction={(fast) => onShift(Direction.DOWN, index, fast)} />)}
            </div>
        </div>
    );
}