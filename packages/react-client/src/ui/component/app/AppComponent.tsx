import classNames from "classnames";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { User } from "@tix320/noir-web-client-core";
import { API } from "@tix320/noir-web-client-core";
import store, { StoreState, userChanged } from '../../../service/Store';
import { removeToken, retrieveToken, storeToken } from "@tix320/noir-web-client-core";
import LoginComponent from "../login/LoginComponent";
import MainComponent from "../main/MainComponent";
import styles from './AppComponent.module.css';

const SERVER_ADDRESS = process.env.REACT_APP_SERVER_ADDRESS || "http://localhost:5000"
console.info(`SERVER_ADDRESS=${SERVER_ADDRESS}`);

type Props = {
    className?: string;
}

export default function AppComponent(props: Props) {
    const login = (token: string, saveToken: boolean) => {
        API.connect(SERVER_ADDRESS, token).then(user => {
            storeToken(token, saveToken)
            store.dispatch(userChanged(new User(user.id, user.name)))
        }).catch(reason => {
            console.error(reason);
            if (reason.message === 'Invalid token') {
                removeToken();
            }
        })
    }

    const user = useSelector((state: StoreState) => state.user);

    useEffect(() => {
        const token = retrieveToken();
        if (token) {
            login(token, false)
        }
    }, [])

    return (
        <div className={classNames(styles.container, props.className)}>
            {user ? <MainComponent className={styles.main} /> : <LoginComponent className={styles.login} onLogin={login} />}
        </div>
    );
}




