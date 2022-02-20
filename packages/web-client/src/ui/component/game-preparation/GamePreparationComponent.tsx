import { Role } from "@tix320/noir-core";
import { JoinedUserInfo } from "@tix320/noir-core/src/dto/GamePreparationState";
import User from "@tix320/noir-core/src/entity/User";
import { Button } from "react-bootstrap";
import { connect } from "react-redux";
import { takeUntil } from "rxjs";
import { Game } from "../../../entity/Game";
import Api from "../../../service/Api";
import { RoleCard } from "../cards/role/RoleCard";
import RxComponent from "../common/RxComponent";
import styles from './GamePreparation.module.css';

type Props = {
    user: User,
    game: Game,
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

        Api.gamePreparationStream(game.id).pipe(takeUntil(this.destroy$)).subscribe((state) => {
            this.setState({
                ...state,
            })
        });
    }

    selectRole = (selectedRole: Role) => {
        Api.changeGameRole({
            role: selectedRole,
            ready: false
        })
    }

    changeReadiness = (role: Role, ready: boolean) => {
        Api.changeGameRole({
            role: role,
            ready: ready
        })
    }

    render() {
        const game = this.props.game;

        return (
            <div>
                <h1>Game prepare {this.props.game.id}</h1>
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

    private isMafiaRole(role: Role) {
        return [Role.KILLER, Role.BOMBER, Role.PSYCHO, Role.SNIPER].includes(role);
    }

    private isFBIRole(role: Role) {
        return [Role.UNDERCOVER, Role.DETECTIVE, Role.SUIT, Role.PROFILER].includes(role);
    }
}

function mapStateToProps(state) {
    const user = state.user;
    return {
        user,
    };
}

export default connect(mapStateToProps)(GamePreparationComponent);