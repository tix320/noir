import './App.css';
import React, { Component } from "react";
import MainComponent from "./component/main/MainComponent";
import { LoginComponent } from "./component/login/LoginComponent";
import { connect } from "react-redux";
import API from "../service/Api";
import { removeToken, retrieveToken, storeToken } from "../service/TokenStorage";
import { User } from '../entity/User';
import store, { currentGameChanged, userChanged } from '../service/Store';

type Props = {
    user: User
}

type State = {
}

class AppComponent extends Component<Props, State> {

    state: State = {};

    componentDidMount() {
        const token = retrieveToken();
        if (token) {
            this.login(token, false)
        }
    }

    login = (token: string, saveToken: boolean) => {
        API.connect(token).then(user => {
            storeToken(token, saveToken)
            store.dispatch(userChanged(user))
            store.dispatch(currentGameChanged(user.currentGame))
        }).catch(reason => {
            console.error(reason);
            if (reason.message === 'Invalid token') {
                removeToken();
            }
        })
    }

    render() {
        const user = this.props.user;

        return (
            <div id='main-screen'>
                {user ? <MainComponent /> : <LoginComponent onLogin={this.login} />}
            </div>
        );
    }
}

function mapStateToProps(state) {
    const user = state.user;
    return {
        user,
    };
}

export default connect(mapStateToProps)(AppComponent);