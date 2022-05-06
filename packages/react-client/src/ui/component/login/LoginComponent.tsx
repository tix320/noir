import { Component } from "react";
import { Button, Form } from "react-bootstrap";
import "./Login.scss";
import logoImg from "@tix320/noir-web-client-core/src/images/logo.png";
import { withTranslation } from 'react-i18next';
import classNames from "classnames";

type Props = {
    className?:string,
    t: any,
    onLogin(username: string, password: string, permanent: boolean): void
}

type State = {
    username: string,
    password: string,
    saveToken: boolean
}

class LoginComponent extends Component<Props, State>  {

    state: State = {
        username: "",
        password: "",
        saveToken: false
    };

    handleSubmit = (event : any) => {
        event.preventDefault();
        this.props.onLogin(this.state.username,this.state.password, this.state.saveToken)
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
                        <div className="form-group">
                            <input type="text" placeholder={locale('username')}
                                onChange={(e) => this.setState({ username: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <input type="password" placeholder={locale('password')}
                                onChange={(e) => this.setState({ password: e.target.value })} />
                        </div>
                        <div className="form-check">
                            <Form.Check
                                type="switch"
                                id="custom-switch"
                                label={locale('save-token')}
                                onChange={(e) => this.setState({ saveToken: e.target.checked })} />

                        </div>
                    </div>
                </div>

                <div className="footer">
                    <Button variant="primary" onClick={this.handleSubmit}>Login</Button>
                </div>
            </div>
        );
    }
}

export default withTranslation()(LoginComponent);