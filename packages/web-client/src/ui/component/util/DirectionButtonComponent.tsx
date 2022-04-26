import { Direction } from "@tix320/noir-core/src/util/Direction";
import { MouseEvent, MouseEventHandler, useEffect, useState } from "react";
import downArrowImg from "../../images/arena/down-arrow.png";
import downDoubleArrowImg from "../../images/arena/down-double-arrow.png";
import leftArrowImg from "../..//images/arena/left-arrow.png";
import leftDoubleArrowImg from "../../images/arena/left-double-arrow.png";
import rightArrowImg from "../../images/arena/right-arrow.png";
import rightDoubleArrowImg from "../../images/arena/right-double-arrow.png";
import upArrowImg from "../../images/arena/up-arrow.png";
import upDoubleArrowImg from "../../images/arena/up-double-arrow.png";
import styles from './DirectionButtonComponent.module.css';


export type Props = {
    className?: string,
    direction: Direction,
    double?: boolean,
    disabled: boolean,
    onMouseEnter?: MouseEventHandler | undefined,
    onMouseLeave?: MouseEventHandler | undefined,
    onClick: MouseEventHandler | undefined
}

export default function DirectionButtonComponent(props: Props) {
    return (<div className={`${props.className} ${styles.container}`}>
        <input
            className={styles.image}
            type="image"
            src={getImgByDirection(props.direction, props.double)}
            disabled={props.disabled}
            onClick={props.onClick}
            onMouseEnter={props.onMouseEnter}
            onMouseLeave={props.onMouseLeave}
        />
    </div>
    );
}

function getImgByDirection(direction: Direction, double?: boolean) {
    switch (direction) {
        case Direction.UP: return double ? upDoubleArrowImg : upArrowImg;
        case Direction.RIGHT: return double ? rightDoubleArrowImg : rightArrowImg;
        case Direction.DOWN: return double ? downDoubleArrowImg : downArrowImg;
        case Direction.LEFT: return double ? leftDoubleArrowImg : leftArrowImg;
    }
}