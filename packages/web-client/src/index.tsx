import "@tix320/noir-core";
import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux';
import styles from './index.module.css';
import "./service/i18n";
import store from './service/Store';
import AppComponent from "./ui/component/app/AppComponent";
import ActionComponent from "./ui/component/game/actions/ActionComponent";

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  // <React.StrictMode>
  <Provider store={store}>
    <AppComponent className={styles.app} />
  </Provider>,
  // </React.StrictMode>,
)