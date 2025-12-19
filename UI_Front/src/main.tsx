import ReactDOM, { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import React from 'react';
import { PreferencesProvider } from './context/PreferencesContext.tsx';

createRoot(document.getElementById("root")!).render(
<React.StrictMode>
    <PreferencesProvider>
        <App />
    </PreferencesProvider>
</React.StrictMode>);
