import React, { useState } from 'react'

interface ErrorScreenProps {
  error: Error | null
  errorInfo: React.ErrorInfo | null
  onReset: () => void
}

/**
 * Debug-friendly full-screen error view.
 *
 * Shown whenever a render/lifecycle/global error bubbles up. Includes the raw
 * message, JavaScript stack trace and React component stack, plus a one-click
 * "Copy details" button so a reporter can paste a full report into a GitHub
 * issue / pull request. Self-contained styling (embedded <style>).
 */
export function ErrorScreen({ error, errorInfo, onReset }: ErrorScreenProps): React.ReactElement {
  const [copied, setCopied] = useState(false)

  const details = [
    '--- omus crash report ---',
    `Time: ${new Date().toLocaleString()}`,
    `Message: ${error?.message ?? 'Unknown error'}`,
    '',
    'Stack trace:',
    error?.stack ?? '(no stack trace available)',
    errorInfo?.componentStack ? `\nReact component stack:\n${errorInfo.componentStack}` : '',
    '',
    'Please include this information when reporting the issue or opening a pull request.'
  ].join('\n')

  const copyDetails = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(details)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
    }
  }

  return (
    <div className="err-screen">
      <style>{`
        .err-screen {
          position: fixed; inset: 0; z-index: 100000;
          display: flex; align-items: center; justify-content: center; padding: 24px;
          background: #080808; color: #f4f4f5;
          font-family: 'Plus Jakarta Sans', sans-serif; user-select: none; overflow: auto;
        }
        .err-card {
          width: 100%; max-width: 560px; border-radius: 18px; padding: 28px;
          background: #111113; border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 24px 60px rgba(0,0,0,0.6);
        }
        .err-icon {
          width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
          font-size: 20px; font-weight: 800; color: #fff; background: #e11d48; margin-bottom: 16px;
        }
        .err-card h1 { font-size: 20px; font-weight: 800; margin: 0 0 6px; }
        .err-card p  { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.65); margin: 0 0 18px; }
        .err-message {
          font-family: ui-monospace, 'Cascadia Code', Consolas, monospace; font-size: 12.5px;
          padding: 12px; border-radius: 10px; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08); color: #fda4af; word-break: break-word; margin-bottom: 12px;
        }
        .err-details { margin-bottom: 18px; }
        .err-details summary {
          cursor: pointer; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.7);
          padding: 6px 0; user-select: none;
        }
        .err-details pre {
          max-height: 220px; overflow: auto; margin: 8px 0 0; padding: 12px;
          font-family: ui-monospace, 'Cascadia Code', Consolas, monospace; font-size: 11px; line-height: 1.5;
          color: rgba(255,255,255,0.75); background: rgba(0,0,0,0.4); border-radius: 10px;
        }
        .err-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .err-actions button {
          flex: 1; min-width: 120px; padding: 11px 16px; border-radius: 10px; cursor: pointer;
          font-size: 13px; font-weight: 700; font-family: inherit;
          border: 1px solid rgba(255,255,255,0.14); background: transparent; color: #f4f4f5;
          transition: transform 0.12s ease, background 0.12s ease, opacity 0.12s ease;
        }
        .err-actions button:hover { background: rgba(255,255,255,0.08); }
        .err-actions button:active { transform: translateY(1px); }
        .err-actions .primary { background: #fff; color: #000; border-color: #fff; }
        .err-actions .primary:hover { opacity: 0.9; }
      `}</style>

      <div className="err-card">
        <div className="err-icon">!</div>
        <h1>Oops! Something went wrong</h1>
        <p>
          omus hit an unexpected error, but don't worry - try reloading the app, or copy the debug details below to include in a bug report or pull request on github to help us fix the issue.
        </p>

        <div className="err-message">{error?.message ?? 'Unknown error'}</div>

        <details className="err-details">
          <summary>View advanced debug details</summary>
          <pre>{details}</pre>
        </details>

        <div className="err-actions">
          <button onClick={() => void copyDetails()}>{copied ? 'Copied!' : 'Copy details'}</button>
          <button onClick={onReset}>Try again</button>
          <button className="primary" onClick={() => window.location.reload()}>
            Reload app
          </button>
        </div>
      </div>
    </div>
  )
}
