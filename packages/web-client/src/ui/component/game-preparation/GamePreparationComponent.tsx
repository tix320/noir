import { Game, RoleSelection } from "@tix320/noir-core/src/game/Game";
import { Role } from "@tix320/noir-core/src/game/Role";
import { assert } from "@tix320/noir-core/src/util/Assertions";
import { equals } from "@tix320/noir-core/src/util/Identifiable";
import classNames from "classnames";
import { useState } from "react";
import { Button } from "react-bootstrap";
import { connect, useSelector } from "react-redux";
import { takeUntil } from 'rxjs/operators';
import User from "../../../entity/User";
import { StoreState } from "../../../service/Store";
import GameCard from "../cards/GameCardComponent";
import RoleCard from "../cards/role/RoleCardComponent";
import { useServerConnectedEffect } from "../common/Hooks";
import randomImg from '../../images/random.png';

import styles from './GamePreparationComponent.module.css';

type Props = {
    className?: string,
    game: Game.Preparation<User>,
}


export default function GamePreparationComponent(props: Props) {

    const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
    const [selectedRoles, setSelectedRoles] = useState<JoinedUserInfo[]>([]);

    const currentUser = useSelector((state: StoreState) => state.user);
    assert(currentUser);

    useServerConnectedEffect(() => {
        const subscription = props.game.participantChanges()
            .subscribe((state) => {
                const adaptedState = adaptParticipants(state);
                setAvailableRoles(adaptedState.availableRoles);
                setSelectedRoles(adaptedState.selectedRoles);
            });

        return () => {
            subscription.unsubscribe();
        }
    }, [props.game]);

    const selectRole = (selectedRole: Role) => {
        props.game.changeRole({
            identity: currentUser,
            role: selectedRole,
            ready: false
        })
    }

    const selectRandom = () => {
        const randomRole = availableRoles[Math.floor(Math.random() * availableRoles.length)];

        props.game.changeRole({
            identity: currentUser,
            role: randomRole,
            ready: false
        })
    }

    const deselectRole = () => {
        props.game.changeRole({
            identity: currentUser,
            ready: false
        })
    }

    const changeReadiness = (role: Role, ready: boolean) => {
        props.game.changeRole({
            identity: currentUser,
            role: role,
            ready: ready
        })
    }

    function renderSelectedRoles(roles: Required<JoinedUserInfo>[]) {
        roles.sort(roleSelectionCompare);

        return (<div className={styles.selectedRolesContainer}>
            {roles.map(({ role, user, ready }) =>
                <div key={user.id} className={styles.roleWithButton}>
                    <RoleCard className={styles.card}
                        topDescription={user.name}
                        additionalClassName={classNames({ [styles.myCard]: equals(user, currentUser!) })}
                        key={role!.name}
                        role={role!}
                        onClick={() => equals(user, currentUser) && deselectRole()}
                    />
                    <Button className={styles.readyButton} variant={ready ? 'success' : 'danger'} disabled={!equals(user, currentUser!)} onClick={() => changeReadiness(role!, !ready)}>
                        {equals(user, currentUser!) ? 'Ready' : ready ? 'Ready' : 'Not ready'}
                    </Button>

                </div>
            )
            }
        </div>);
    }

    function renderAvailableRoles(roles: Role[], myRole: Role | undefined) {
        return (roles
            .map(role => <RoleCard
                className={classNames(styles.availableRoleCard, styles.card)}
                key={role.name}
                role={role}
                highlight={myRole === undefined}
                onClick={selectRole} />)
        );
    }

    const mafiaSelectedRoles = selectedRoles.filter(({ role }) => role && isMafiaRole(role)) as Required<JoinedUserInfo>[];
    const fbiSelectedRoles = selectedRoles.filter(({ role }) => role && isFBIRole(role)) as Required<JoinedUserInfo>[];

    const mafiaAvailableRoles = availableRoles.filter((role) => isMafiaRole(role));
    const fbiAvailableRoles = availableRoles.filter((role) => isFBIRole(role));

    const mySelectedRole: Role | undefined = selectedRoles.find(role => equals(role.user, currentUser))?.role;

    return (
        <div>
            <div className={classNames(styles.container, props.className)}>
                {renderSelectedRoles(mafiaSelectedRoles)}

                <div className={styles.availableRolesContainer}>
                    {
                        renderAvailableRoles(mafiaAvailableRoles, mySelectedRole)
                    }
                    {!mySelectedRole && <GameCard
                        className={classNames(styles.availableRoleCard, styles.card)}
                        image={randomImg}
                        highlight={true}
                        onClick={selectRandom}
                    />
                    }
                    {
                        renderAvailableRoles(fbiAvailableRoles, mySelectedRole)
                    }
                </div>

                {renderSelectedRoles(fbiSelectedRoles)}
            </div>
        </div>
    );
}

interface GamePreparationState {
    availableRoles: Role[],
    selectedRoles: JoinedUserInfo[]
}

interface JoinedUserInfo {
    user: User,
    role?: Role,
    ready: boolean
}

function isMafiaRole(role: Role) {
    return role.team === 'MAFIA';
}

function isFBIRole(role: Role) {
    return role.team === 'FBI';
}

function adaptParticipants(participants: RoleSelection<User>[]): GamePreparationState {
    let availableRoles = new Set(Role.FOR_8_GAME);

    const selectedRoles: JoinedUserInfo[] = [];

    participants.forEach((participant => {
        selectedRoles.push({
            user: participant.identity,
            role: participant.role,
            ready: participant.ready
        });

        if (participant.role) {
            availableRoles.delete(participant.role);
        }
    }));

    return {
        availableRoles: Array.from(availableRoles),
        selectedRoles: selectedRoles
    };
}

function roleSelectionCompare(info1: { role: Role }, info2: { role: Role }): number {
    return info1.role!.name.localeCompare(info2.role!.name);
}