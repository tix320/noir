import {Component} from "react";
import "./Login.scss";
import loginImg from "./spy-logo.png";
import {Button, Checkbox} from "@mui/material";

export class LoginScreen extends Component {

    constructor(props, context) {
        super(props, context);
        this.state = {
            token: "",
            saveToken: false
        }

        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(event) {
        event.preventDefault();
        this.props.onLogin(this.state.token, this.state.saveToken)
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
                        <div className="form-check">
                            <Checkbox onChange={(e) => this.setState({saveToken: e.target.checked})} />
                            <label className="form-check-label" htmlFor="flexCheckChecked">
                                Save token
                            </label>
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