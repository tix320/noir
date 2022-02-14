import { Component } from "react";
import { Role } from '@tix320/noir-core';
import frameImg from '../../images/cards/frame.png';

type Props = {
    role: Role,
    onClick: () => void
}

type State = {
}

export class RoleCard extends Component<Props, State> {

    render() {
        const role = this.props.role;

        return (
            <div onClick={this.props.onClick}>
                <img src={frameImg}>
                    <img src={`../../images/cards/roles/${role.toLowerCase()}`}>
                    </img>
                </img>
            </div>
        );
    }
}