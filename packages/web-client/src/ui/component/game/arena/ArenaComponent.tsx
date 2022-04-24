import { Arena, Marker, ShiftAction, Suspect } from "@tix320/noir-core/src/game/Game";
import { GameHelper } from "@tix320/noir-core/src/game/GameHelper";
import { Direction } from "@tix320/noir-core/src/util/Direction";
import Position from "@tix320/noir-core/src/util/Position";
import classNames from "classnames";
import { Fragment } from "react";
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
    supportHighlightMarkers?: [Position, Marker[]][],
    onShift(direction: Direction, index: number, fast: boolean): void,
    onContextMenu(): void,
    onSuspectClick(position: Position, suspect: Suspect): void,
    onMarkerClick(position: Position, suspect: Suspect, marker: Marker): void,
}

export default function ArenaComponent(props: Props) {
    const { className, arena, disableShift, lastShift, teamHighlight, supportHighlight, supportHighlightMarkers, onShift, onSuspectClick, onMarkerClick } = props;

    const isReverseShift = (direction: Direction, index: number) => {
        return !!lastShift && GameHelper.isReverseShifts({ direction: direction, index: index }, lastShift);
    }

    const arenaSize = arena.size;
    const arr = [...Array(arenaSize)].map(a => a + 1);

    const gridStyles = {
        gridTemplateColumns: `2% repeat(${arenaSize}, minmax(auto, ${arenaSize == 6 ? 15 : 14}%)) 2%`,
        gridTemplateRows: `2% repeat(${arenaSize}, minmax(auto, ${arenaSize == 6 ? 15 : 13}%)) 2%`
    };

    return (
        <div className={classNames(styles.container, props.className)}
            style={gridStyles}
            onContextMenu={(event) => { props.onContextMenu(); event.preventDefault(); return false; }} >
            <div />

            {arr.map((e, index) => <Shift className={styles.shiftCell} key={`up${index}`}
                direction={Direction.UP}
                disabled={disableShift || isReverseShift(Direction.UP, index)}
                fast={props.fastShift}
                onAction={(fast) => onShift(Direction.UP, index, fast)} />)}

            <div />
            {
                arr.map((e, row) =>
                    <Fragment key={row}>
                        <Shift className={styles.shiftCell} key={`left${row}`}
                            direction={Direction.LEFT}
                            disabled={disableShift || isReverseShift(Direction.LEFT, row)}
                            fast={props.fastShift}
                            onAction={(fast) => onShift(Direction.LEFT, row, fast)} />

                        {arr.map((e, column) => <SuspectCard className={styles.suspectCell} key={column}
                            suspect={arena.at(row, column)}
                            additionalClassName={props.meHighlight?.x === row && props.meHighlight?.y === column ?
                                styles.mySuspect
                                : teamHighlight?.some(pos => pos.x === row && pos.y === column) ? styles.teamSuspect : undefined}
                            highlight={supportHighlight?.some(pos => pos.x === row && pos.y === column)}
                            highlightMarkers={supportHighlightMarkers?.find(posWithMarkers => posWithMarkers[0].x === row && posWithMarkers[0].y === column)?.[1]}
                            onSuspectClick={suspect => onSuspectClick(new Position(row, column), suspect)}
                            onMarkerClick={(suspect, marker) => onMarkerClick(new Position(row, column), suspect, marker)} />)}

                        <Shift className={styles.shiftCell} key={`right${row}`}
                            direction={Direction.RIGHT}
                            disabled={disableShift || isReverseShift(Direction.RIGHT, row)}
                            fast={props.fastShift}
                            onAction={(fast) => onShift(Direction.RIGHT, row, fast)} />
                    </Fragment>
                )
            }

            <div />
            {arr.map((e, index) => <Shift className={styles.shiftCell} key={`down${index}`}
                direction={Direction.DOWN}
                disabled={disableShift || isReverseShift(Direction.DOWN, index)}
                fast={props.fastShift}
                onAction={(fast) => onShift(Direction.DOWN, index, fast)} />)}
            <div />

        </div>
    );
}