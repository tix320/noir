import { GameActions } from '@tix320/noir-core/src/game/GameActions';
import styles from './ActionComponent.module.scss';

type Props<K extends GameActions.Any> = {
    action: GameActions.Key<K>,
    description: string,
    available: boolean,
    selected: boolean,
    onPerform: (action: GameActions.Key<K>) => void
}

export default function ActionComponent<K extends GameActions.Any>(props: Props<K>) {
    const onPerform = () => props.onPerform(props.action);

    const image = require(`../../../images/action/${props.action}.png`);

    return (
        <div className={styles.container} >
            <input type='image'
                className={`${styles.icon} ${props.selected ? styles.selectedIcon : ''}`}
                src={image}
                disabled={!props.available}
                onClick={onPerform}
            />
            <span className={styles.tooltip}>
                {props.action.capitalize()}
            </span>
        </div>
    );
}