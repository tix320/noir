import {Avatar} from "@mui/material";
import {Component} from "react";
import {UserContext} from "../../../user-context";
import "./Profile.css";
import avatarImg from "./avatar.png";

export class Profile extends Component {

    static contextType = UserContext

    render() {
        return (
            <div id={this.props.id}>
                <h4><label id='label'>{this.context.name}</label></h4>
                <Avatar id='avatar' src={avatarImg}/>
            </div>
        );
    }
}