import { Component } from "react";
import React from "react";
import { Button, Form } from "react-bootstrap";
import API from "../../../service/Api";
import {GameMode} from '@tix320/noir-core';
import { Game } from "../../../entity/Game";

type Props = {
    onGameCreate(game: Game): void
}

type State = {
    mode: string
}

export class GameCreationComponent extends Component<Props,State> {

    state = {
        mode: "0"
    }

    changeMode = (event) => {
        this.setState({
            mode: event.target.value
        })
    }

    createGame = () => {
        API.createGame({ mode: this.state.mode}).then(game => {
            this.props.onGameCreate(game);
        });
       
    }

    render() {

        return (
            <div>
                <Form.Select isInvalid={this.state.mode === "0"} onChange={this.changeMode}>
                    <option value="0">Choose game mode</option>
                    <option value={GameMode.KILLER_VS_INSPECTOR}> Killer vs Inspector </option>
                    <option value={GameMode.MAFIA_VS_FBI}>Mafia vs FBI</option>
                </Form.Select>


                <Button onClick={this.createGame} disabled={this.state.mode === "0"}> Create</Button>
            </div>
        );
    }
}