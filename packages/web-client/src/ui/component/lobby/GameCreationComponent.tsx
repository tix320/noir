import { Component } from "react";
import { Button, Form } from "react-bootstrap";
import API from "../../../service/Api";

type Props = {
}

type State = {
    name?: string
}

export default class GameCreationComponent extends Component<Props, State> {

    state: State = {
    }

    changeName = (event: any) => {
        this.setState({
            name: event.target.value
        })
    }

    createGame = () => {
        API.createGame({ name: this.state.name });
    }

    render() {

        return (
            <div>
                <Form.Control placeholder="Enter name" onChange={this.changeName} />
                <Button disabled={!this.state.name} onClick={this.createGame}> Create</Button>
            </div>
        );
    }
}