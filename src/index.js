import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/theme.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './services/auth'; // 🆕 Add this import
import * as serviceWorkerRegistration from './serviceWorkerRegistration'; // ✅ Moved to top
import 'antd/dist/reset.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider> {/* 🆕 Wrap App with AuthProvider */}
      <App />
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();

// ✅ 22-July-2025: Register service worker for PWA support
serviceWorkerRegistration.register();
