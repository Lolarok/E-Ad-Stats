import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { FirestoreErrorBoundary } from './components/FirestoreErrorBoundary';
import { FirebaseProvider } from './contexts/FirebaseContext';

createRoot(document.getElementById('root')!).render(
  <FirestoreErrorBoundary>
    <FirebaseProvider>
      <App />
    </FirebaseProvider>
  </FirestoreErrorBoundary>
);
