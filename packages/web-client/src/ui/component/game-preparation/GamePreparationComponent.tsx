import { Game, RoleSelection } from "@tix320/noir-core/src/game/Game";
import { Role } from "@tix320/noir-core/src/game/Role";
import { Button } from "react-bootstrap";
import { connect } from "react-redux";
import { takeUntil } from 'rxjs/operators';
import User from "../../../entity/User";
import Api from "../../../service/Api";
import RoleCard from "../cards/role/RoleCardComponent";
import RxComponent from "../common/RxComponent";

import styles from './GamePreparationComponent.module.css';

type Props = {
    user: User,
    game: Game.Preparation<User>,
}

type State = {
    availableRoles: Role[],
    selectedRoles: JoinedUserInfo[]
}

class GamePreparationComponent extends RxComponent<Props, State> {

    state: State = {
        availableRoles: [],
        selectedRoles: [],
    }

    componentDidMount(): void {
        const game = this.props.game;
        game.participantChanges()
            .pipe(takeUntil(this.destroy$))
            .subscribe((state) => {
                const adaptedState = this.adaptParticipants(state);
                this.setState({
                    ...adaptedState,
                })
            });
    }

    selectRole = (selectedRole: Role) => {
        this.props.game.changeRole({
            identity: this.props.user,
            role: selectedRole,
            ready: false
        })
    }

    changeReadiness = (role: Role, ready: boolean) => {
        this.props.game.changeRole({
            identity: this.props.user,
            role: role,
            ready: ready
        })
    }

    render() {
        const game = this.props.game;

        return (
            <div>
                <h1>Game prepare</h1>
                <div className={styles.main}>
                    {this.renderSelectedRoles(this.state.selectedRoles.filter(({ role }) => role && this.isMafiaRole(role)))}


                    <div className={styles.availableRolesContainer}>
                        {this.state.availableRoles
                            .map(role => <RoleCard key={role.name} role={role} onClick={this.selectRole} />)}
                    </div>


                    {this.renderSelectedRoles(this.state.selectedRoles.filter(({ role }) => role && this.isFBIRole(role)))}
                </div>
            </div>
        );
    }

    private renderSelectedRoles(roles: JoinedUserInfo[]) {
        return (<div className={styles.selectedRolesContainer}>
            {roles.map(({ role, user, ready }) =>
                <div key={user.id}>
                    <RoleCard key={role!.name} role={role!} />
                    <div>{user.name}</div>
                    <Button variant={ready ? 'success' : 'danger'} disabled={user.id !== this.props.user.id} onClick={() => this.changeReadiness(role!, !ready)}>
                        {ready ? 'Ready' : 'Not ready'}
                    </Button>

                </div>
            )
            }
        </div>);
    }

    private isMafiaRole(role: Role) {
        return role.team === 'MAFIA';
    }

    private isFBIRole(role: Role) {
        return role.team === 'FBI';
    }

    private adaptParticipants(participants: RoleSelection<User>[]): GamePreparationState {
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

function mapStateToProps(state: any) {
    const user = state.user;
    return {
        user,
    };
}

export default connect(mapStateToProps)(GamePreparationComponent);