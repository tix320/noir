import { GameActions } from '@tix320/noir-core/src/game/GameActions';
import { Role } from '@tix320/noir-core/src/game/Role';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import Action from './ActionComponent';
import styles from './ActionsPanelComponent.module.css';

type Props = {
    className?: string,
    role: Role,
    availableActions: Set<GameActions.Key>,
    alwaysShowDetails?: boolean,
    selectedAction?: GameActions.Key,
    enabled: boolean,
    onActionSelect?: (action: GameActions.Key) => void,
}

export interface ActionAvailability<K extends GameActions.Any = GameActions.Any> {
    key: GameActions.Key<K>,
    available: boolean
}

export default function ActionsPanelComponent(props: Props) {
    return (
        <div className={classNames(styles.container, props.className)}>
            {resolveAvailableActions(props.role, props.availableActions).map(action =>
                <Action
                    className={styles.action}
                    key={action.key}
                    role={props.role}
                    action={action.key}
                    available={(!props.selectedAction || props.selectedAction === action.key) && action.available && props.enabled}
                    selected={action.key === props.selectedAction}
                    alwaysShowDetails={props.alwaysShowDetails}
                    onPerform={props.onActionSelect} />)}
        </div>
    );
}

function resolveAvailableActions(role: Role, availableActions: Set<GameActions.Key>): ActionAvailability[] {
    let actions: ActionAvailability[];

    if (role === Role.DETECTIVE) {
        actions = role.actions
            .filter(action => action !== 'pickInnocentsForCanvas' && action !== 'canvas')
            .map(action => (
                {
                    key: action,
                    available: availableActions.has(action),
                }));

        actions.push({
            key: 'canvas',
            available: availableActions.has('pickInnocentsForCanvas'),
        });

    } else if (role === Role.SUIT) {
        actions = role.actions
            .filter(action => action !== 'placeProtection' && action !== 'removeProtection' && action !== 'decideProtect')
            .map(action => (
                {
                    key: action,
                    available: availableActions.has(action),
                }));

        actions.push({
            key: 'placeProtection',
            available: availableActions.has('placeProtection') || availableActions.has('removeProtection'),
        });
    } else if (role === Role.BOMBER) {
        actions = role.actions.filter(action => action !== 'selfDestruct').map(action => ({
            key: action,
            available: availableActions.has(action)
        }));
    } else {
        actions = role.actions.map(action => ({
            key: action,
            available: availableActions.has(action)
        }));
    }

    return actions;
}