import {Component} from "react";
import "./Login.scss";
import loginImg from "./spy-logo.png";

export class LoginScreen extends Component {

    constructor(props, context) {
        super(props, context);
        this.state = {
            token: ""
        }

        this.validateForm = this.validateForm.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    validateForm() {
        return this.state.token;
    }

    handleSubmit(event) {
        event.preventDefault();
        this.props.onLogin(this.state.token)
    }

    render() {
        return (
            <div className="base-container">
                <div className="content">
                    <div className="image">
                        <img src={loginImg}/>
                    </div>
                    <div className="form">
                        <div className="form-group">
                            <input type="text" name="token" placeholder="Token"
                                   onChange={(e) => this.setState({token: e.target.value})}/>
                        </div>
                    </div>
                </div>
                <div className="footer">
                    <button type="button" className="btn" disabled={!this.validateForm()} onClick={this.handleSubmit}>
                        Login
                    </button>
                </div>
            </div>
        );
    }
}