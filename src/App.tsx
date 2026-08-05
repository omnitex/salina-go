import { useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { AppRoutes } from './routes/AppRoutes';

const THEME_KEY = 'salina-go:theme';

function ThemeInitializer() {
  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);
  return null;
}

export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <ThemeInitializer />
        <AppRoutes />
      </AppProvider>
    </HashRouter>
  );
}