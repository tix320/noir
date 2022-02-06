import React from 'react';
import './index.css';
import AppComponent from './ui/AppComponent';
import 'bootstrap/dist/css/bootstrap.min.css';
import reactDom from 'react-dom';

reactDom.render(
    <React.StrictMode>
        <AppComponent/>
    </React.StrictMode>,
    document.getElementById('root')
);