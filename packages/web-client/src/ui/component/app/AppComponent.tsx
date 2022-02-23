import { Component } from "react";
import { connect } from "react-redux";
import User from '../../../entity/User';
import API from "../../../service/Api";
import store, { userChanged } from '../../../service/Store';
import { removeToken, retrieveToken, storeToken } from "../../../service/TokenStorage";
import LoginComponent from "../login/LoginComponent";
import MainComponent from '../main/MainComponent';
import styles from './App.module.css';

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
            <div className={styles.mainScreen}>
                {user ? <MainComponent /> : <LoginComponent onLogin={this.login} />}
            </div>
        );
    }
}

function mapStateToProps(state: any) {
    const user = state.user;
    return {
        user,
    };
}

export default connect(mapStateToProps)(AppComponent);