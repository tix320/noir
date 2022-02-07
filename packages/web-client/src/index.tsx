import React from 'react';
import './index.css';
import AppComponent from './ui/AppComponent';
import 'bootstrap/dist/css/bootstrap.min.css';
import reactDom from 'react-dom';
import { Provider } from 'react-redux'
import store from './service/Store';

reactDom.render(
    <React.StrictMode>
        <Provider store={store}>
            <AppComponent />
        </Provider>
    </React.StrictMode>,
    document.getElementById('root')
);