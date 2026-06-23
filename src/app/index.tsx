import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import '../shared/styles/globals.css';

const AppProvider: React.FC = () => (
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

export default AppProvider;
