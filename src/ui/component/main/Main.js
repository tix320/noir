import {Component} from "react";
import {UserContext} from "../../user-context";

export class MainScreen extends Component {

    static contextType = UserContext

    render() {
        return <h1>Logged in {this.context.name}</h1>;
    }
}