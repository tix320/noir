import { Component } from "react";
import "./Profile.css";
import Avatar from 'react-avatar';
import React from "react";
import avatarImg from "./avatar.png";
import { connect } from "react-redux";
import { User } from "../../../../entity/User";

type Props = {
    id: string,
    user: User
}

type State = {
}

class ProfileComponent extends Component<Props, State> {

    render() {
        const user = this.props.user;

        return (
            <div id={this.props.id}>
                <h4><label id='label'>{user.name}</label></h4>
                <Avatar className="avatar" size="50" src={avatarImg} />
            </div>
        );
    }
}

function mapStateToProps(state) {
    console.log(state)
    const user = state.user;
    return {
        user,
    };
}

export default connect(mapStateToProps)(ProfileComponent);
