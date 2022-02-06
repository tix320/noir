import React from "react";
import { Component } from "react";
import { Button, Form } from "react-bootstrap";
import "./Login.scss";
import loginImg from "./spy-logo.png";

type Props = {
    onLogin(token: string, permanent: boolean): void
}

type State = {
    token: string,
    saveToken: boolean
}

export class LoginComponent extends Component<Props, State>  {

    state: State = {
        token: "",
        saveToken: false
    };

    handleSubmit = (event) => {
        event.preventDefault();
        this.props.onLogin(this.state.token, this.state.saveToken)
    }

    render() {
        return (
            <div className="base-container">
                <div className="content">
                    <div className="image">
                        <img alt="logo" src={loginImg} />
                    </div>
                    <div className="form">
                        <div className="form-group">
                            <input type="text" name="token" placeholder="Token"
                                onChange={(e) => this.setState({ token: e.target.value })} />
                        </div>
                        <div className="form-check">
                            <Form.Check
                                type="switch"
                                id="custom-switch"
                                label=" Save token"
                                onChange={(e) => this.setState({ saveToken: e.target.checked })} />

                        </div>
                    </div>
                </div>

                <div className="footer">
                    <Button variant="contained" onClick={this.handleSubmit}>Login</Button>
                </div>
            </div>
        );
    }
}