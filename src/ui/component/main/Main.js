import {Component} from "react";
import {UserContext} from "../../user-context";
import "./Main.css";
import {Profile} from "./profile/Profile";

export class MainScreen extends Component {

    static contextType = UserContext

    render() {
        return (
            <div  >
                <Profile id="profile" />
                <button className="img">Play</button>
            </div>
        );
    }
}