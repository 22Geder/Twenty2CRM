"use client"

import React, { Component, ReactNode, ErrorInfo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  componentName?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo)
    this.setState({ errorInfo })
    
    // Log to server (optional - for debugging in production)
    try {
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          componentName: this.props.componentName,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {}) // Silent fail
    } catch {
      // Ignore logging errors
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-700 flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5" />
              שגיאה בטעינת {this.props.componentName || 'הרכיב'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600 mb-4">
              אירעה שגיאה. אנא נסה לרענן או צור קשר עם התמיכה.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 text-xs bg-white p-2 rounded border border-red-200">
                <summary className="cursor-pointer text-red-700 font-medium">פרטי השגיאה (פיתוח)</summary>
                <pre className="mt-2 whitespace-pre-wrap text-gray-700 overflow-auto max-h-40">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <Button 
              onClick={this.handleReset}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              נסה שוב
            </Button>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

// HOC for wrapping functional components
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary componentName={componentName} fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    )
  }
}
