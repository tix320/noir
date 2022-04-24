import { GameActions } from '@tix320/noir-core/src/game/GameActions';
import classNames from 'classnames';
import { useEffect } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRefState } from '../../common/Hooks';
import Action from './ActionComponent';
import styles from './ActionsPanelComponent.module.css';

type Props = {
    className?: string,
    actions: ActionAvailability<GameActions.Any>[],
    selectedAction: GameActions.Key | undefined,
    enabled: boolean,
    onActionSelect: (action: GameActions.Key) => void,
}

export interface ActionAvailability<K extends GameActions.Any = GameActions.Any> {
    key: GameActions.Key<K>,
    available: boolean
}

export default function ActionsPanelComponent(props: Props) {
    const { t } = useTranslation();

    return (
        <div className={classNames(styles.container, props.className)}>
            {props.actions.map(action =>
                <Action
                    className={styles.action}
                    key={action.key}
                    action={action.key}
                    description={t(`actions.${action.key}`)}
                    available={(!props.selectedAction || props.selectedAction === action.key) && action.available && props.enabled}
                    selected={action.key === props.selectedAction}
                    onPerform={props.onActionSelect} />)}
        </div>
    );
}