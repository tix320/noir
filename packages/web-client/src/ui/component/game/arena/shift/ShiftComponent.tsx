import { Direction } from "@tix320/noir-core/src/util/Direction";
import downArrowImg from "../../../../images/arena/down-arrow.png";
import leftArrowImg from "../../../../images/arena/left-arrow.png";
import rightArrowImg from "../../../../images/arena/right-arrow.png";
import upArrowImg from "../../../../images/arena/up-arrow.png";
import styles from './ShiftComponent.module.css';


type Props = {
    direction: Direction
}

export default function ShiftComponent(props: Props) {
    return (<div className={styles.container}>
        <img className={styles.image} src={getImgByDirection(props.direction)} />
    </div>
    );
}

function getImgByDirection(direction: Direction) {
    switch (direction) {
        case Direction.UP: return upArrowImg;
        case Direction.RIGHT: return rightArrowImg;
        case Direction.DOWN: return downArrowImg;
        case Direction.LEFT: return leftArrowImg;
    }
}