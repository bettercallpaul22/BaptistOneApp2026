import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AppButton, AppText } from '@/components/common';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application error boundary caught an error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center content-center gap-4 bg-[#F8FAFC] p-4">
          <AppText variant="h2" align="center">
            Something went wrong
          </AppText>
          <AppText variant="bodyMedium" align="center" color="textSecondary">
            Please refresh the page or return home.
          </AppText>
          <AppButton onClick={() => window.location.assign('/')}>Return Home</AppButton>
        </main>
      );
    }

    return this.props.children;
  }
}
