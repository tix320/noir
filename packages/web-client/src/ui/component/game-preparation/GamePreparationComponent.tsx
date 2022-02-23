import { RoleType } from "@tix320/noir-core";
import Game from "@tix320/noir-core/src/dto/Game";
import { JoinedUserInfo } from "@tix320/noir-core/src/dto/GamePreparationState";
import { Button } from "react-bootstrap";
import { connect } from "react-redux";
import { takeUntil } from "rxjs";
import User from "../../../entity/User";
import Api from "../../../service/Api";
import { RoleCard } from "../cards/role/RoleCard";
import RxComponent from "../common/RxComponent";
import styles from './GamePreparation.module.css';

type Props = {
    user: User,
    game: Game,
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

        Api.gamePreparationStream(game.id).pipe(takeUntil(this.destroy$)).subscribe((state) => {
            this.setState({
                ...state,
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

    private isMafiaRole(role: RoleType) {
        return [RoleType.KILLER, RoleType.BOMBER, RoleType.PSYCHO, RoleType.SNIPER].includes(role);
    }

    private isFBIRole(role: RoleType) {
        return [RoleType.UNDERCOVER, RoleType.DETECTIVE, RoleType.SUIT, RoleType.PROFILER].includes(role);
    }
}

function mapStateToProps(state: any) {
    const user = state.user;
    return {
        user,
    };
}

export default connect(mapStateToProps)(GamePreparationComponent);