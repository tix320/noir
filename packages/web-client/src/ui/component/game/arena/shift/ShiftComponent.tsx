import { Direction } from "@tix320/noir-core/src/util/Direction";
import { MouseEvent, useEffect, useState } from "react";
import downArrowImg from "../../../../images/arena/down-arrow.png";
import downDoubleArrowImg from "../../../../images/arena/down-double-arrow.png";
import leftArrowImg from "../../../../images/arena/left-arrow.png";
import leftDoubleArrowImg from "../../../../images/arena/left-double-arrow.png";
import rightArrowImg from "../../../../images/arena/right-arrow.png";
import rightDoubleArrowImg from "../../../../images/arena/right-double-arrow.png";
import upArrowImg from "../../../../images/arena/up-arrow.png";
import upDoubleArrowImg from "../../../../images/arena/up-double-arrow.png";
import styles from './ShiftComponent.module.css';


type Props = {
    className?: string,
    direction: Direction,
    disabled: boolean,
    fast: boolean,
    onAction: (fast: boolean) => void
}

export default function ShiftComponent(props: Props) {
    const onClick = (event: MouseEvent) => {
        props.onAction(props.fast && event.ctrlKey);
    }

    const [enableFast, setEnableFast] = useState<boolean>(false);

    useEffect(() => {
        if (props.fast) {
            const keyDownListener: (this: Document, ev: KeyboardEvent) => any = (event) => {
                if (event.code === 'ControlLeft') {
                    setEnableFast(true);
                }
            };

            const keyUpListener: (this: Document, ev: KeyboardEvent) => any = (event) => {
                if (event.code === 'ControlLeft') {
                    setEnableFast(false);
                }
            };

            document.addEventListener('keydown', keyDownListener);
            document.addEventListener('keyup', keyUpListener);

            return () => {
                document.removeEventListener('keydown', keyDownListener);
                document.removeEventListener('keydown', keyUpListener);
            }
        }
    }, [props.fast]);

    return (<div className={`${props.className} ${styles.container}`}>
        <input className={styles.image} type="image" src={getImgByDirection(props.direction, enableFast)} onClick={onClick} disabled={props.disabled} />
    </div>
    );
}

function getImgByDirection(direction: Direction, fast: boolean) {
    switch (direction) {
        case Direction.UP: return fast ? upDoubleArrowImg : upArrowImg;
        case Direction.RIGHT: return fast ? rightDoubleArrowImg : rightArrowImg;
        case Direction.DOWN: return fast ? downDoubleArrowImg : downArrowImg;
        case Direction.LEFT: return fast ? leftDoubleArrowImg : leftArrowImg;
    }
}