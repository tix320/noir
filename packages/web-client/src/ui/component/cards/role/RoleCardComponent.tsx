import { RoleType } from "@tix320/noir-core/src/game/RoleType";
import { Component } from "react";
import GameCard from "../GameCardComponent";

type Props = {
    className?: string,
    role: RoleType,
    onClick?: (role: RoleType) => void
}

type State = {
    image?: string
}

export default class RoleCard extends Component<Props, State> {

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
            <GameCard className={this.props.className} image={image!} description={RoleType.capitalize(role)} onClick={this.onClick} />
        );
    }
}