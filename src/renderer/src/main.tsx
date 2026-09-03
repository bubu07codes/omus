import './assets/main.css'

import { StrictMode, Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ErrorScreen } from './components/ErrorScreen'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * Error boundary that catches render/lifecycle errors AND global errors
 * (`error` / `unhandledrejection`), then shows a debug screen with the full
 * message + stack and a one-click "Copy details" action for bug reports / PRs.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null, errorInfo: null }

  static getDerivedStateFromError(error: unknown): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error:
        error instanceof Error
          ? error
          : new Error(typeof error === 'string' ? error : String(error))
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary] render error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  componentDidMount(): void {
    window.addEventListener('error', this.handleGlobalError)
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection)
  }

  componentWillUnmount(): void {
    window.removeEventListener('error', this.handleGlobalError)
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection)
  }

  private handleGlobalError = (event: ErrorEvent): void => {
    // Prevent the default (console-only) noise; we render our own error screen.
    event.preventDefault()
    this.setState({
      hasError: true,
      error: event.error instanceof Error ? event.error : new Error(event.message)
    })
  }

  private handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    event.preventDefault()
    const reason = event.reason
    this.setState({
      hasError: true,
      error: reason instanceof Error ? reason : new Error(String(reason))
    })
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorScreen
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)
