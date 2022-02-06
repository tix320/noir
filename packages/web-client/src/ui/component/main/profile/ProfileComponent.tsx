import { Component } from "react";
import { UserContext } from "../../../../service/UserContext";
import "./Profile.css";
import Avatar from 'react-avatar';
import React from "react";
import avatarImg from "./avatar.png";

type Props = {
    id: string
}

type State = {
}

export class ProfileComponent extends Component<Props, State> {

    static contextType = UserContext

    render() {
        return (
            <div id={this.props.id}>
                <h4><label id='label'>{this.context.name}</label></h4>
                <Avatar size="50" src={avatarImg} />
            </div>
        );
    }
}
