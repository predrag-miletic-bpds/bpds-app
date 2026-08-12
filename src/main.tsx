import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { BpdsPrototype } from './bpds-prototype';
import './style.css';
const root=document.getElementById('root');
if(root)createRoot(root).render(<BrowserRouter><BpdsPrototype/></BrowserRouter>);
