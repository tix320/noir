import { Character } from "@tix320/noir-core/src/game/Character";
import { Role } from "@tix320/noir-core/src/game/Role";
import { Tooltip } from "@mui/material";
import classNames from "classnames";
import { useEffect, useState } from "react";
import ActionsPanelComponent from "../../game/actions/ActionsPanelComponent";
import CharacterCard, { Props as CharacterCardProps } from "../character/CharacterCardComponent";
import styles from './RoleCardComponent.module.css';

type OmitFields = 'onClick';

type Props = Omit<Partial<CharacterCardProps>, OmitFields> & {
    role: Role,
    character?: Character,
    onClick?: (role: Role) => void
}

export default function RoleCardComponent(props: Props) {
    const { role, onClick } = props;


    const onRoleClick = () => {
        if (onClick) {
            onClick(role);
        }
    }

    const character = props.character ??
        (role.team === 'MAFIA'
            ? new Character("100", role.name)
            : new Character("101", role.name));

    const roleImage = require(`../../../images/card/role/${role.name.toLowerCase()}.png`);

    return (
        <Tooltip
            title={<ActionsPanelComponent role={props.role} availableActions={new Set()} enabled={false} alwaysShowDetails={true} ></ActionsPanelComponent>}
            placement="bottom"
            enterDelay={500}
            enterNextDelay={500}
            componentsProps={{
                tooltip: {
                    sx: {
                        bgcolor: 'rgba(38, 38, 38, 0.95)',
                        width: '10vw',
                    },
                },
            }}>

            <div className={classNames(styles.container, props.className)}>
                <CharacterCard {...props} className={styles.card} character={character} onClick={onRoleClick} />
                <img className={styles.roleIcon} src={roleImage} />
            </div>
        </Tooltip>

    );
}