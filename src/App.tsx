import { Provider } from 'react-redux';
import { ToastViewport } from './components/feedback';
import NotificationSocketListener from './components/realtime/NotificationSocketListener';
import { ErrorBoundary } from './routes/ErrorBoundary';
import { AppRouter } from './routes';
import { store } from './store';

export default function App() {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <AppRouter />
        <ToastViewport />
        <NotificationSocketListener />
      </ErrorBoundary>
    </Provider>
  );
}
