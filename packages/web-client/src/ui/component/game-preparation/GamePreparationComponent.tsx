import Game, { RoleSelection } from "@tix320/noir-core/src/game/Game";
import { RoleType } from "@tix320/noir-core/src/game/RoleType";
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
    game: Game<User>,
}

type State = {
    availableRoles: RoleType[],
    selectedRoles: JoinedUserInfo[]
}

class GamePreparationComponent extends RxComponent<Props, State> {

    state: State = {
        availableRoles: [],
        selectedRoles: [],
    }

    componentDidMount(): void {
        const game = this.props.game;
        game.getPreparingState().participantChanges().pipe(takeUntil(this.destroy$)).subscribe((state) => {
            const adaptedState = this.adaptParticipants(state);
            this.setState({
                ...adaptedState,
            })
        });
    }

    selectRole = (selectedRole: RoleType) => {
        Api.changeGameRole({
            role: selectedRole,
            ready: false
        })
    }

    changeReadiness = (role: RoleType, ready: boolean) => {
        Api.changeGameRole({
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


                    <div className={styles.avaialbleRolesContainer}>
                        {this.state.availableRoles
                            .map(role => <RoleCard className={styles.availableRoleCard} key={role} role={role} onClick={this.selectRole} ></RoleCard>)}
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
                    <RoleCard className={styles.selectedRoleCard} key={role} role={role!}></RoleCard>
                    <div>{user.name}</div>
                    <Button variant={ready ? 'success' : 'danger'} disabled={user.id !== this.props.user.id} onClick={() => this.changeReadiness(role!, !ready)}>
                        {ready ? 'Ready' : 'Not ready'}
                    </Button>

                </div>
            )
            }
        </div>);
    }

    private isMafiaRole(role: RoleType) {
        return [RoleType.KILLER, RoleType.BOMBER, RoleType.PSYCHO, RoleType.SNIPER].includes(role);
    }

    private isFBIRole(role: RoleType) {
        return [RoleType.UNDERCOVER, RoleType.DETECTIVE, RoleType.SUIT, RoleType.PROFILER].includes(role);
    }

    private adaptParticipants(participants: RoleSelection<User>[]): GamePreparationState {
        let availableRoles = new Set(RoleType.for8());

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
    availableRoles: RoleType[],
    selectedRoles: JoinedUserInfo[]
}

interface JoinedUserInfo {
    user: User,
    role?: RoleType,
    ready: boolean
}

function mapStateToProps(state: any) {
    const user = state.user;
    return {
        user,
    };
}

export default connect(mapStateToProps)(GamePreparationComponent);