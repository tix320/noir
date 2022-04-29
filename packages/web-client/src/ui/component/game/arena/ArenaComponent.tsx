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
    className?: string,
    arena: Arena,
    fastShift: boolean,
    disableShift: boolean,
    lastShift?: ShiftAction,
    meHighlight?: Position,
    teamHighlight?: Position[],
    supportHighlight?: Position[],
    supportHighlightMarkers?: [Position, Marker[]][],
    alert?: Position[],
    onShift(direction: Direction, index: number, fast: boolean): void,
    onContextMenu(): void,
    onSuspectClick(position: Position, suspect: Suspect): void,
    onMarkerClick(position: Position, suspect: Suspect, marker: Marker): void,
}

export default function ArenaComponent(props: Props) {
    const { className, arena, disableShift, lastShift, teamHighlight, supportHighlight, supportHighlightMarkers, alert, onShift, onSuspectClick, onMarkerClick } = props;

    const isReverseShift = (direction: Direction, index: number) => {
        return !!lastShift && GameHelper.isReverseShifts({ direction: direction, index: index }, lastShift);
    }

    const arenaRowSize = arena.rows;
    const arenaColumnSize = arena.columns;
    const arrRow = [...Array(arenaRowSize)].map(a => a + 1);
    const arrCol = [...Array(arenaColumnSize)].map(a => a + 1);

    const gridStyles = {
        gridTemplateRows: `2% repeat(${arenaRowSize}, minmax(auto, ${arenaRowSize == 7 ? 13 : 15}%)) 2%`,
        gridTemplateColumns: `2% repeat(${arenaColumnSize}, minmax(auto, ${arenaColumnSize == 7 ? 14 : 15}%)) 2%`,
    };

    return (
        <div className={classNames(styles.container, props.className)}
            style={gridStyles}
            onContextMenu={(event) => { props.onContextMenu(); event.preventDefault(); return false; }} >
            <div />

            {arrCol.map((e, index) => <Shift className={styles.shiftCell} key={`up${index}`}
                direction={Direction.UP}
                disabled={disableShift || isReverseShift(Direction.UP, index)}
                fast={props.fastShift}
                onAction={(fast) => onShift(Direction.UP, index, fast)} />)}

            <div />
            {
                arrRow.map((e, row) =>
                    <Fragment key={row}>
                        <Shift className={styles.shiftCell} key={`left${row}`}
                            direction={Direction.LEFT}
                            disabled={disableShift || isReverseShift(Direction.LEFT, row)}
                            fast={props.fastShift}
                            onAction={(fast) => onShift(Direction.LEFT, row, fast)} />

                        {arrCol.map((e, column) => <SuspectCard className={styles.suspectCell} key={column}
                            suspect={arena.at(row, column)}
                            additionalClassName={props.meHighlight?.x === row && props.meHighlight?.y === column ?
                                styles.mySuspect
                                : teamHighlight?.some(pos => pos.x === row && pos.y === column) ? styles.teamSuspect : undefined}
                            additionalHighLightClassName={alert?.some(pos => pos.x === row && pos.y === column) ? styles.alert : undefined}
                            highlight={supportHighlight?.some(pos => pos.x === row && pos.y === column) || alert?.some(pos => pos.x === row && pos.y === column)}
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
            {arrCol.map((e, index) => <Shift className={styles.shiftCell} key={`down${index}`}
                direction={Direction.DOWN}
                disabled={disableShift || isReverseShift(Direction.DOWN, index)}
                fast={props.fastShift}
                onAction={(fast) => onShift(Direction.DOWN, index, fast)} />)}
            <div />

        </div>
    );
}