import { Component } from "react";
import { Role } from '@tix320/noir-core';
import './RoleCard.css';
import { Card } from "../Card";

type Props = {
    className?: string,
    role: Role,
    onClick?: (role: Role) => void
}

type State = {
    image?
}

export class RoleCard extends Component<Props, State> {

    state: State = {}

    onClick = () => {
        if (this.props.onClick) {
            this.props.onClick(this.props.role);
        }
    }

    componentDidMount(): void {
        import(`../../../images/cards/roles/${this.props.role.toLowerCase()}.png`).then(image => {
            this.setState({
                image: image.default
            });
        });
    }

    render() {
        const image = this.state.image;
        const role = this.props.role;

        return (
            <Card className={this.props.className} image={image} description={Role.capitalize(role)} onClick={this.onClick} />
        );
    }
}