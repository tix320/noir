import { GameActions } from '@tix320/noir-core/src/game/GameActions';
import { GameHelper } from '@tix320/noir-core/src/game/GameHelper';
import { Role } from '@tix320/noir-core/src/game/Role';
import classNames from 'classnames';
import { MouseEventHandler, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './ActionComponent.module.scss';
import Tooltip, { tooltipClasses, TooltipProps } from '@mui/material/Tooltip';
import styled from '@emotion/styled';

type Props<K extends GameActions.Any> = {
    className?: string,
    role: Role,
    action: GameActions.Key<K>,
    available: boolean,
    selected: boolean,
    onPerform: (action: GameActions.Key<K>) => void
}

const CustomWidthTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} classes={{ popper: className }} />
  ))({
    [`& .${tooltipClasses.tooltip}`]: {
      maxWidth: "30vw",
    },
  });

export default function ActionComponent<K extends GameActions.Any>(props: Props<K>) {
    const onPerform = () => props.onPerform(props.action);

    const image = require(`../../../images/action/${props.action}.png`);

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
            document.removeEventListener('keydown', keyUpListener);
        }
    }, []);

    const tooltipHtml = createMarkup(props.role, props.action, showDetails, t);

    return (
        <CustomWidthTooltip
            title={<div className={styles.tooltip} dangerouslySetInnerHTML={{ __html: tooltipHtml }}></div>}
            placement="top-end"
            componentsProps={{
                tooltip: {
                    sx: {
                        bgcolor: 'rgba(38, 38, 38, 0.95)',
                    },
                },
            }}
        >
            <div className={classNames(styles.container, props.className)}>
                <input type='image'
                    className={`${styles.icon} ${props.selected ? styles.selectedIcon : ''}`}
                    src={image}
                    onClick={onPerform}
                />
            </div>
        </CustomWidthTooltip>
    );
}

function createMarkup(role: Role, action: GameActions.Key, showDetails: boolean, t: any) {
    const header = `<span style='font-size:1.3em;'>${t(`action.description.header[${action}]`)}</span> </br>`;
    const details = showDetails
        ? t(`action.description.details[${action}]`, {
            shiftCount: Role.CAN_DO_FAST_SHIFT.includes(role) ? 2 : 1
        })
        : t("action.description.details.enableHint");

    return `<div class=${styles.tooltip}> ${header + details} </div>`;
};