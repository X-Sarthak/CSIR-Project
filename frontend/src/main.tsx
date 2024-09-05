import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
//remove this at the of deployment phase
<StrictMode>
<App />
</StrictMode>
);
