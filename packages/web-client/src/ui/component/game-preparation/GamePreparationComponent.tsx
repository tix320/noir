import { GameMode, Role } from "@tix320/noir-core";
import { JoinedUserInfo } from "@tix320/noir-core/src/dto/GamePreparationState";
import User from "@tix320/noir-core/src/entity/User";
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
    myRole: Role
}

class GamePreparationComponent extends RxComponent<Props, State> {

    state: State = {
        availableRoles: [],
        selectedRoles: [],
        myRole: null
    }

    componentDidMount(): void {
        const game = this.props.game;

        Api.gamePreparationStream(game.id).pipe(takeUntil(this.destroy$)).subscribe((state) => {
            this.setState({
                ...state,
                myRole: state.selectedRoles.find(joinedUserInfo => this.props.user.id === joinedUserInfo.user.id)[1]
            })
        });
    }

    selectRole = (selectedRole: Role) => {
        if (this.state.myRole) {
            return
        }

        Api.changeGameRole({
            role: selectedRole,
            ready: false
        })
    }

    render() {
        const game = this.props.game;

        return (
            <div>
                <h1>Game prepare {this.props.game.id}</h1>
                {this.renderByMode(game.mode)}
            </div>
        );
    }

    private renderByMode(mode: GameMode) {
        switch (mode) {
            case GameMode.MAFIA_VS_FBI:
                return (
                    <div className={styles.main}>
                        {this.renderSelectedRoles(this.state.selectedRoles.filter(({ role }) => this.isMafiaRole(role)))}


                        <div className={styles.avaialbleRolesContainer}>
                            {this.state.availableRoles
                                .map(role => <RoleCard className={styles.availableRoleCard} key={role} role={role} onClick={this.selectRole} ></RoleCard>)}
                        </div>


                        {this.renderSelectedRoles(this.state.selectedRoles.filter(({ role }) => this.isFBIRole(role)))}
                    </div>
                );
            default:
                throw new Error('Uknown mode');
        }
    }

    private renderSelectedRoles(roles: JoinedUserInfo[]) {
        return (<div className={styles.selectedRolesContainer}>
            {roles.map(({ role, user, ready }) =>
                <div key={user.id}>
                    <RoleCard className={styles.selectedRoleCard} key={role} role={role}></RoleCard>
                    <div>{user.name}</div>
                    <div>{ready ? 'Ready' : 'Not ready'}</div>
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