import React from 'react';
import { Routes,Route,Navigate } from 'react-router-dom';
import { PracticeMode } from './practice-mode';
export function BpdsPrototype(){return <Routes><Route path="/practice" element={<PracticeMode/>}/><Route path="*" element={<Navigate to="/practice" replace/>}/></Routes>}
