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
import Api from "../../../service/Api";
import { StoreState } from "../../../service/Store";
import RoleCard from "../cards/role/RoleCardComponent";
import { useServerConnectedEffect } from "../common/Hooks";
import RxComponent from "../common/RxComponent";

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

    const changeReadiness = (role: Role, ready: boolean) => {
        props.game.changeRole({
            identity: currentUser,
            role: role,
            ready: ready
        })
    }

    function renderSelectedRoles(roles: JoinedUserInfo[]) {
        return (<div className={styles.selectedRolesContainer}>
            {roles.map(({ role, user, ready }) =>
                <div key={user.id}>
                    <RoleCard className={styles.card} key={role!.name} role={role!} highlight={equals(user, currentUser)} />
                    <div>{user.name}</div>
                    <Button variant={ready ? 'success' : 'danger'} disabled={user.id !== user.id} onClick={() => changeReadiness(role!, !ready)}>
                        {ready ? 'Ready' : 'Not ready'}
                    </Button>

                </div>
            )
            }
        </div>);
    }

    return (
        <div>
            <div className={classNames(styles.container, props.className)}>
                {renderSelectedRoles(selectedRoles.filter(({ role }) => role && isMafiaRole(role)))}


                <div className={styles.availableRolesContainer}>
                    {availableRoles
                        .map(role => <RoleCard className={styles.card} key={role.name} role={role} onClick={selectRole} />)}
                </div>


                {renderSelectedRoles(selectedRoles.filter(({ role }) => role && isFBIRole(role)))}
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