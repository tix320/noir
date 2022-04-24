import { GameActions } from '@tix320/noir-core/src/game/GameActions';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import styles from './ActionComponent.module.scss';

type Props<K extends GameActions.Any> = {
    className?: string,
    action: GameActions.Key<K>,
    available: boolean,
    selected: boolean,
    onPerform: (action: GameActions.Key<K>) => void
}

export default function ActionComponent<K extends GameActions.Any>(props: Props<K>) {
    const onPerform = () => props.onPerform(props.action);

    const image = require(`../../../images/action/${props.action}.png`);

    const { t } = useTranslation();

    return (
        <div className={classNames(styles.container, props.className)} >
            <input type='image'
                className={`${styles.icon} ${props.selected ? styles.selectedIcon : ''}`}
                src={image}
                disabled={!props.available}
                onClick={onPerform}
            />
            <span className={styles.tooltip}>
                {actionDetails(props.action, t)}
            </span>
        </div>
    );
}

function actionDetails(action: GameActions.Key, locale: any) {
    return action.capitalize();
}