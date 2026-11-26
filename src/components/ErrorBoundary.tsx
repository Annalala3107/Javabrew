// Lucian UX/UI Prompt #090 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#090
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ChevronDown, Home, RefreshCw, ZapOff } from 'lucide-react';
import './lucian/lucian-090.css';

interface ErrorBoundaryProps {
  children: ReactNode;
  onGoHome?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
    showDetails: false,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      errorMessage: error?.message || 'Lỗi tải giao diện không mong muốn.',
    };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Captured cleanly into UI fallback state
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoDashboard = () => {
    this.setState({ hasError: false, errorMessage: '', showDetails: false });
    if (this.props.onGoHome) {
      this.props.onGoHome();
    } else {
      window.location.assign('/dashboard');
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <div className="ux u090" role="alert">
          <div className="u090-h">
            <i aria-hidden="true">
              <ZapOff className="h-4 w-4" aria-hidden="true" />
            </i>
            <b>JavaBrew Runtime Recovery</b>
            <span className="u090-pill" role="status">
              Sự cố hiển thị
            </span>
          </div>

          <div className="u090-stage">
            <svg className="u090-plug" viewBox="0 0 220 70" aria-hidden="true">
              <g className="u090-L">
                <path className="u090-cord" d="M-14 54C24 54 40 35 72 35" />
                <path className="u090-pr" d="M100 28h14M100 42h14" />
                <rect className="u090-bd" x="68" y="19" width="34" height="32" rx="8" />
              </g>
              <g className="u090-spark">
                <path d="M121 20l-2-7M129 24l5-5M113 24l-5-5M121 50l-2 7M129 46l5 5M113 46l-5 5" />
              </g>
              <g className="u090-R">
                <rect className="u090-bd" x="124" y="17" width="38" height="36" rx="9" />
                <path className="u090-hole" d="M124 28h6M124 42h6" />
                <circle className="u090-led" cx="153" cy="25" r="3" />
                <path className="u090-cord" d="M162 35C188 35 194 16 236 16" />
              </g>
            </svg>

            <h1 className="u090-t">Không thể tải trang hiện tại</h1>
            <p className="u090-s">
              Có thể phiên bản mới vừa được cập nhật hoặc một thành phần gặp lỗi. Code nháp đã lưu
              trong trình duyệt vẫn an toàn.
            </p>

            <button
              type="button"
              className="u090-more"
              aria-expanded={this.state.showDetails}
              onClick={() =>
                this.setState((prev) => ({ ...prev, showDetails: !prev.showDetails }))
              }
            >
              <span>Chi tiết kỹ thuật</span>
              <ChevronDown aria-hidden="true" />
            </button>
            <div className="u090-det">
              <div>
                <code>{this.state.errorMessage}</code>
              </div>
            </div>
          </div>

          <div className="u090-actions">
            <button type="button" className="u090-go" onClick={this.handleReload}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span>Tải lại trang</span>
            </button>
            <button type="button" className="u090-sec" onClick={this.handleGoDashboard}>
              <Home className="h-4 w-4" aria-hidden="true" />
              <span>Về Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}
