import { GameMode, Role } from "@tix320/noir-core";
import { Component } from "react";
import { Game } from "../../../entity/Game";
import { User } from "../../../entity/User";
import Api from "../../../service/Api";
import { RoleCard } from "../cards/role/RoleCard";
import styles from './GamePreparation.module.css';

type Props = {
    game: Game,
}

type State = {
    avaialbleRoles: Role[],
    selectedRoles: Map<Role, User>,
    myRole: Role
}

export class GamePreparationComponent extends Component<Props, State> {

    state: State = {
        avaialbleRoles: [],
        selectedRoles: new Map([[Role.KILLER, {id:'dsa', name:'Killer',}],[Role.UNDERCOVER, {id:'dsadd', name:'Undercover',}]]),
        myRole: null
    }

    componentDidMount(): void {
        const roles = Role.getOfMode(this.props.game.mode);
        this.setState({
            avaialbleRoles: roles
        })
    }

    selectRole = (selectedRole: Role) => {
        if (this.state.myRole) {
            return
        }

        Api.joinGame({
            gameId: this.props.game.id,
            role: selectedRole,
            ready: false
        }).then(() => {
            this.setState((prevState) => {
                return {
                    avaialbleRoles: prevState.avaialbleRoles.filter(role => role !== selectedRole),
                    myRole: selectedRole
                }
            })
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
        const selectedRoles = Array.from(this.state.selectedRoles.entries());
        console.log(selectedRoles.filter(entry => this.isMafiaRole(entry[0])))
        switch (mode) {
            case GameMode.MAFIA_VS_FBI:
                return (
                    <div className={styles.main}>
                        <div className={styles.selectedRolesContainer}>
                            {selectedRoles.filter(entry => this.isMafiaRole(entry[0])).map(([role, user]) =>
                                <div>
                                    <RoleCard className={styles.selectedRoleCard} key={role} role={role}></RoleCard>
                                    <div>{user.name}</div>
                                </div>
                            )
                            }
                        </div>


                        <div className={styles.avaialbleRolesContainer}>
                            {this.state.avaialbleRoles.map(role => <RoleCard className={styles.availableRoleCard} key={role} role={role} onClick={this.selectRole} ></RoleCard>)}
                        </div>


                        <div className={styles.selectedRolesContainer}>
                            {selectedRoles.filter(entry => this.isFBIRole(entry[0])).map(([role, user]) =>
                                <div>
                                    <RoleCard className={styles.selectedRoleCard} key={role} role={role}></RoleCard>
                                    <div>{user.name}</div>
                                </div>
                            )
                            }
                        </div>
                    </div>
                );
            default:
                throw new Error('Uknown mode');
        }
    }

    private isMafiaRole(role: Role) {
        return [Role.KILLER, Role.BOMBER, Role.PSYCHO, Role.SNIPER].includes(role);
    }
    
    private isFBIRole(role: Role) {
        return [Role.UNDERCOVER, Role.DETECTIVE, Role.SUIT, Role.PROFILER].includes(role);
    }
}