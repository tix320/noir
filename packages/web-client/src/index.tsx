import "@tix320/noir-core";
import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import reactDom from 'react-dom';
import { Provider } from 'react-redux';
import styles from './index.module.css';
import "./service/i18n";
import store from './service/Store';
import AppComponent from "./ui/component/app/AppComponent";

reactDom.render(
    // <React.StrictMode>
        <Provider store={store}>
            <AppComponent className={styles.app} />
        </Provider>,
    // </React.StrictMode>,
    document.getElementById('root')
);