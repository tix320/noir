import { Component, KeyboardEvent } from "react";
import { Alert, Button, Form } from "react-bootstrap";
import "./Login.scss";
import logoImg from "@tix320/noir-web-client-core/src/images/logo.png";
import { withTranslation } from 'react-i18next';
import classNames from "classnames";

type Props = {
    className?: string,
    t: any,
    onLogin(register: boolean, username: string, password: string, permanent: boolean): Promise<void>
}

type State = {
    register: boolean,
    username: string,
    password: string,
    saveToken: boolean,
    disabled: boolean,
    error?: string
}

class LoginComponent extends Component<Props, State>  {

    state: State = {
        register: false,
        username: "",
        password: "",
        saveToken: false,
        disabled: false
    };

    onLogin = async () => {
        this.setState({ disabled: true });
        try {
            await this.props.onLogin(this.state.register, this.state.username, this.state.password, this.state.saveToken);
        } catch (error) {
            const message = error.message === "Invalid credentials" ? error.message : "Connection error";
            this.setState({ error: message, disabled: false });
        }
    };

    handleSubmit = (event: any) => {
        event.preventDefault();
        this.onLogin();
    }

    handleKeyDown = (event: KeyboardEvent) => {
        this.setState({ error: undefined });
        if (event.code === 'Enter') {
            this.onLogin();
        }
    }

    render() {
        const locale = this.props.t;

        const classnames = classNames("base-container", this.props.className);

        return (
            <div className={classnames}>
                <div className="content">
                    <div className="image">
                        <img alt="logo" src={logoImg} />
                    </div>
                    <div className="form">
                    <div className="form-check">
                            <Form.Check
                                type="switch"
                                id="custom-switch"
                                label={locale('register')}
                                onChange={(e) => this.setState({ register: e.target.checked })} />

                        </div>

                        <div className="form-group">
                            <input type="text" placeholder={locale('username')}
                                onKeyDown={this.handleKeyDown}
                                onChange={(e) => this.setState({ username: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <input type="password" placeholder={locale('password')}
                                onKeyDown={this.handleKeyDown}
                                onChange={(e) => this.setState({ password: e.target.value })} />
                        </div>
                        {this.state.error && <Alert variant='danger'>
                            {this.state.error}
                        </Alert>}
                        <div className="form-check">
                            <Form.Check
                                type="switch"
                                id="custom-switch"
                                label={locale('remember-me')}
                                onChange={(e) => this.setState({ saveToken: e.target.checked })} />

                        </div>
                    </div>
                </div>

                <div className="footer">
                    <Button variant="primary" disabled={this.state.disabled} onClick={this.handleSubmit}>{this.state.register ? 'Register' : 'Login'}</Button>
                </div>
            </div>
        );
    }
}

export default withTranslation()(LoginComponent);