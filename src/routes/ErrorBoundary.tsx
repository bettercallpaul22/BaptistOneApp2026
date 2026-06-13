import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AppButton, AppText } from '@/components/common';

const CHUNK_LOAD_RELOAD_KEY = 'baptistone:chunk-load-reload-at';
const CHUNK_LOAD_RELOAD_TTL_MS = 60_000;
const RECOVERY_CLEAR_DELAY_MS = 30_000;

interface ErrorBoundaryState {
  hasError: boolean;
  isChunkLoadError: boolean;
  isRecovering: boolean;
}

const chunkLoadErrorPatterns = [
  /ChunkLoadError/i,
  /Loading chunk [\d\w-]+ failed/i,
  /Failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /Importing a module script failed/i,
  /Failed to load module script/i,
];

const getErrorText = (error: unknown) => {
  if (error instanceof Error) {
    return `${error.name} ${error.message}`;
  }

  return String(error);
};

const isChunkLoadError = (error: unknown) =>
  chunkLoadErrorPatterns.some((pattern) => pattern.test(getErrorText(error)));

const getRecentChunkReload = () => {
  try {
    const reloadedAt = Number(window.sessionStorage.getItem(CHUNK_LOAD_RELOAD_KEY));
    return Number.isFinite(reloadedAt) && Date.now() - reloadedAt < CHUNK_LOAD_RELOAD_TTL_MS;
  } catch {
    return false;
  }
};

const markChunkReload = () => {
  try {
    window.sessionStorage.setItem(CHUNK_LOAD_RELOAD_KEY, String(Date.now()));
  } catch {
    // Ignore storage failures. A normal reload is still the best recovery path.
  }
};

const clearChunkReload = () => {
  try {
    window.sessionStorage.removeItem(CHUNK_LOAD_RELOAD_KEY);
  } catch {
    // Ignore storage failures.
  }
};

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  private recoveryClearTimeout: number | undefined;

  state: ErrorBoundaryState = { hasError: false, isChunkLoadError: false, isRecovering: false };

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, isChunkLoadError: isChunkLoadError(error), isRecovering: false };
  }

  componentDidMount() {
    this.recoveryClearTimeout = window.setTimeout(clearChunkReload, RECOVERY_CLEAR_DELAY_MS);
  }

  componentWillUnmount() {
    if (this.recoveryClearTimeout) {
      window.clearTimeout(this.recoveryClearTimeout);
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application error boundary caught an error', error, info);

    if (!isChunkLoadError(error) || getRecentChunkReload()) {
      return;
    }

    markChunkReload();
    this.setState({ isRecovering: true });
    window.setTimeout(() => window.location.reload(), 100);
  }

  render() {
    if (this.state.hasError) {
      if (this.state.isChunkLoadError && this.state.isRecovering) {
        return (
          <main className="grid min-h-screen place-items-center content-center gap-3 bg-[#F8FAFC] p-4">
            <AppText variant="h2" align="center">
              Updating app
            </AppText>
            <AppText variant="bodyMedium" align="center" color="textSecondary">
              Loading the latest version for you.
            </AppText>
          </main>
        );
      }

      return (
        <main className="grid min-h-screen place-items-center content-center gap-4 bg-[#F8FAFC] p-4">
          <AppText variant="h2" align="center">
            {this.state.isChunkLoadError ? 'Update required' : 'Something went wrong'}
          </AppText>
          <AppText variant="bodyMedium" align="center" color="textSecondary">
            {this.state.isChunkLoadError
              ? 'Please refresh the page to load the latest app files.'
              : 'Please refresh the page or return home.'}
          </AppText>
          <AppButton onClick={() => (this.state.isChunkLoadError ? window.location.reload() : window.location.assign('/'))}>
            {this.state.isChunkLoadError ? 'Refresh' : 'Return Home'}
          </AppButton>
        </main>
      );
    }

    return this.props.children;
  }
}
