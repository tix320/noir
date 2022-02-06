import './App.css';
import React, { Component } from "react";
import { MainComponent } from "./component/main/MainComponent";
import { LoginComponent } from "./component/login/LoginComponent";
import { UserContext } from "../service/UserContext";
import API from "../service/Api";
import { removeToken, retrieveToken, storeToken } from "../service/TokenStorage";
import { User } from '../entity/User';

type Props = {
}

type State = {
    user?: User
}

export default class AppComponent extends Component<Props, State> {

    state: State = {};

    componentDidMount() {
        const token = retrieveToken();
        if (token) {
            this.login(token, false)
        }
    }

    login = (token, saveToken) => {
        API.connect(token).then(user => {
            storeToken(token, saveToken)
            this.setState({ user })
        }).catch(reason => {
            console.error(reason);
            if (reason.message === 'Invalid token') {
                removeToken();
            }
        })
    }

    render() {
        const user = this.state.user;

        return (
            <UserContext.Provider value={user}>
                <div id='main-screen'>
                    {user ? <MainComponent /> : <LoginComponent onLogin={this.login} />}
                </div>
            </UserContext.Provider>
        );
    }
}