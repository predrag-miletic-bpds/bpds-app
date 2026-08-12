import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { BpdsPrototype } from './bpds-prototype';
import './style.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <BpdsPrototype />
    </BrowserRouter>
  </React.StrictMode>
);
