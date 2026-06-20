import { PersistGate } from 'redux-persist/integration/react';
import { Provider } from 'react-redux';
import { ToastViewport } from './components/feedback';
import NotificationSocketListener from './components/realtime/NotificationSocketListener';
import { ErrorBoundary } from './routes/ErrorBoundary';
import { AppRouter } from './routes';
import { persistor, store } from './store';

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor} loading={null}>
        <ErrorBoundary>
          <AppRouter />
          <ToastViewport />
          <NotificationSocketListener />
        </ErrorBoundary>
      </PersistGate>
    </Provider>
  );
}
