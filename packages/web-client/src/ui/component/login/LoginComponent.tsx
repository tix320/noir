import { Component } from "react";
import { Button, Form } from "react-bootstrap";
import "./Login.scss";
import logoImg from "../../images/logo.png";
import { withTranslation } from 'react-i18next';

type Props = {
    t: any,
    onLogin(token: string, permanent: boolean): void
}

type State = {
    token: string,
    saveToken: boolean
}

class LoginComponent extends Component<Props, State>  {

    state: State = {
        token: "",
        saveToken: false
    };

    handleSubmit = (event : any) => {
        event.preventDefault();
        this.props.onLogin(this.state.token, this.state.saveToken)
    }

    render() {
        const locale = this.props.t;

        return (
            <div className="base-container">
                <div className="content">
                    <div className="image">
                        <img alt="logo" src={logoImg} />
                    </div>
                    <div className="form">
                        <div className="form-group">
                            <input type="text" placeholder={locale('token')}
                                onChange={(e) => this.setState({ token: e.target.value })} />
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