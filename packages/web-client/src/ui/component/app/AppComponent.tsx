import styles from './App.module.css';
import { Component } from "react";
import { LoginComponent } from "../login/LoginComponent";
import { connect } from "react-redux";
import API from "../../../service/Api";
import { removeToken, retrieveToken, storeToken } from "../../../service/TokenStorage";
import store, { userChanged } from '../../../service/Store';
import MainComponent from '../main/MainComponent';
import User from '../../../entity/User';

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