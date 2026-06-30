import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches React render errors (e.g., undefined component type)
 * and displays a fallback UI instead of crashing the whole app.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="lma-flex lma-items-center lma-justify-center lma-min-h-[200px] !lma-p-6">
          <div className="lma-text-center lma-space-y-3">
            <p className="lma-text-destructive lma-font-medium">
              Có lỗi khi hiển thị nội dung
            </p>
            <p className="lma-text-sm lma-text-muted-foreground">
              {this.state.error?.message}
            </p>
            <button
              type="button"
              className="lma-text-sm lma-text-accent hover:lma-underline"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Thử lại
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
