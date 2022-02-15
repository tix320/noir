import { Component } from "react";
import styles from "./Profile.module.css";
import Avatar from 'react-avatar';
import avatarImg from "../../../images/avatar.png";
import { connect } from "react-redux";
import User from "@tix320/noir-core/src/entity/User";

type Props = {
    className: string,
    user: User
}

type State = {
}

class ProfileComponent extends Component<Props, State> {

    render() {
        const user = this.props.user;

        return (
            <div className={this.props.className}>
                <h4><label className={styles.label}>{user.name}</label></h4>
                <Avatar className={styles.avatar} size="50" src={avatarImg} />
            </div>
        );
    }
}

function mapStateToProps(state) {
    const user = state.user;
    return {
        user,
    };
}

export default connect(mapStateToProps)(ProfileComponent);
