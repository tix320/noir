import './App.css';
import React, {Component} from "react";
import {MainScreen} from "./ui/component/main/Main";
import {LoginScreen} from "./ui/component/login/Login";
import {UserContext} from "./ui/user-context";
import {connect} from "./service/authentication";
import {removeToken, retrieveToken, storeToken} from "./service/token-storage";

export default class App extends Component {

    state = {
        user: null
    }

    componentDidMount() {
        const token = retrieveToken();
        if (token) {
            this.login(token)
        }
    }

    login = (token) => {
        connect(token).then(user => {
            storeToken(token)
            this.setState({user})
        }).catch(reason => {
            console.error(reason);
            if (reason.message === 'Invalid token') {
                removeToken();
            }
        })
    }

    render() {
        const user = this.state.user;
        if (user) {
            return (
                <UserContext.Provider value={user}>
                    <MainScreen/>
                </UserContext.Provider>
            );
        } else {
            return (
                <LoginScreen onLogin={this.login}/>
            );
        }
    }
}