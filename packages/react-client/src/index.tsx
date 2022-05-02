import "@tix320/noir-core";
import "@tix320/noir-web-client-core";
import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux';
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.min.css';
import styles from './index.module.css';
import "./service/i18n";
import store from './service/Store';
import AppComponent from "./ui/component/app/AppComponent";
import ActionComponent from "./ui/component/game/actions/ActionComponent";

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
    <Provider store={store}>
      <AppComponent className={styles.app} />
      <ToastContainer newestOnTop={true} limit={3} />
    </Provider>
)