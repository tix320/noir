import React from 'react';
import './index.css';
import AppComponent from './ui/component/app/AppComponent';
import 'bootstrap/dist/css/bootstrap.min.css';
import reactDom from 'react-dom';
import { Provider } from 'react-redux'
import store from './service/Store';
import "./service/i18n";

reactDom.render(
    <React.StrictMode>
        <Provider store={store}>
            <AppComponent />
        </Provider>
    </React.StrictMode>,
    document.getElementById('root')
);