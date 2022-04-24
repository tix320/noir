import { Character } from "@tix320/noir-core/src/game/Character";
import { Role } from "@tix320/noir-core/src/game/Role";
import classNames from "classnames";
import { useEffect, useState } from "react";
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
            ? new Character( Character.ALL.length + "", role.name)
            : new Character(Character.ALL.length + 1 + "", role.name));

    const roleImage = require(`../../../images/card/role/${role.name.toLowerCase()}.png`);

    return (
        <div className={classNames(styles.container, props.className)}>
            <CharacterCard className={styles.card} {...props} character={character} onClick={onRoleClick} />
            <img className={styles.roleIcon} src={roleImage}/>
        </div>
    );
}