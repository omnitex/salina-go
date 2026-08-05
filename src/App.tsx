import { HashRouter } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </HashRouter>
  );
}