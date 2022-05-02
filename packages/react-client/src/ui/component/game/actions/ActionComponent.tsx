import { GameActions } from '@tix320/noir-core/src/game/GameActions';
import { Role } from '@tix320/noir-core/src/game/Role';
import Tooltip from '@mui/material/Tooltip';
import classNames from 'classnames';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './ActionComponent.module.scss';

type Props<K extends GameActions.Any> = {
    className?: string,
    role: Role,
    action: GameActions.Key<K>,
    available: boolean,
    selected: boolean,
    alwaysShowDetails?: boolean,
    onPerform?: (action: GameActions.Key<K>) => void
}

export default function ActionComponent<K extends GameActions.Any>(props: Props<K>) {
    const onPerform = () => {
        if (props.onPerform && props.available) {
            props.onPerform(props.action);
        }
    };

    const image = require(`@tix320/noir-web-client-core/src/images/action/${props.action}.png`);

    const { t } = useTranslation();

    const [showDetails, setShowDetails] = useState<boolean>(false);

    useEffect(() => {
        const keyDownListener: (this: Document, ev: KeyboardEvent) => any = (event) => {
            if (event.code === 'ControlLeft') {

                setShowDetails(true);
            }
        };

        const keyUpListener: (this: Document, ev: KeyboardEvent) => any = (event) => {
            if (event.code === 'ControlLeft') {
                setShowDetails(false);
            }
        };

        document.addEventListener('keydown', keyDownListener);
        document.addEventListener('keyup', keyUpListener);

        return () => {
            document.removeEventListener('keydown', keyDownListener);
            document.removeEventListener('keyup', keyUpListener);
        }
    }, []);

    const tooltipHtml = createMarkup(props.role, props.action, props.alwaysShowDetails || showDetails, t);

    return (
        <Tooltip
            title={<div className={styles.tooltip} dangerouslySetInnerHTML={{ __html: tooltipHtml }}></div>}
            placement="top-end"
            enterDelay={500}
            enterNextDelay={500}
            componentsProps={{
                tooltip: {
                    sx: {
                        bgcolor: 'rgba(38, 38, 38, 0.95)',
                        maxWidth: '30vw'
                    },
                },
            }}
        >
            <div className={classNames(styles.container, props.className)}>
                <input type='image'
                    className={classNames(styles.icon,
                        {
                            [styles.selectedIcon]: props.selected,
                            [styles.actionAvailable]: props.available,
                            [styles.actionNotAvailable]: !props.available
                        })}
                    src={image}
                    onClick={onPerform}
                />
            </div>
        </Tooltip>
    );
}

function createMarkup(role: Role, action: GameActions.Key, showDetails: boolean, t: any) {
    const header = `<span style='font-size:1.3em;'>${t(`action.description.header[${action}]`)}</span> </br>`;
    const details = showDetails
        ? t(`action.description.details[${action}]`, {
            shiftCount: role.canDoFastShift ? '1 or 2' : '1',
            doubleShiftHint: role.canDoFastShift ? `</br></br> Press <span style='color:#ff66ec;'>S</span> to switch <span style='color:#ff66ec;'>double shift</span>.` : ''
        })
        : t("action.description.details.enableHint");

    return `<div class=${styles.tooltip}> ${header + details} </div>`;
};