/**
 * ErrorBoundary - React 错误边界组件
 * 捕获子组件中的 JavaScript 错误并显示友好的错误提示
 */

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(): Partial<State> {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo,
        });
    }

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
                    <div className="glass-panel rounded-2xl p-8 max-w-2xl w-full border border-white/10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-red-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">出错了</h1>
                                <p className="text-gray-400 text-sm mt-1">应用遇到了一个意外错误</p>
                            </div>
                        </div>

                        {this.state.error && (
                            <div className="mb-6">
                                <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                                    <p className="text-red-300 font-mono text-sm mb-2">
                                        {this.state.error.toString()}
                                    </p>
                                    {this.state.errorInfo && (
                                        <details className="mt-3">
                                            <summary className="text-gray-400 text-xs cursor-pointer hover:text-gray-300">
                                                查看详细信息
                                            </summary>
                                            <pre className="mt-2 text-xs text-gray-500 overflow-auto max-h-64 custom-scrollbar">
                                                {this.state.errorInfo.componentStack}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all transform hover:-translate-y-0.5 font-medium"
                            >
                                重试
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 px-6 py-3 bg-white/10 text-gray-300 rounded-xl hover:bg-white/20 transition-colors font-medium"
                            >
                                刷新页面
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 mt-6 text-center">
                            如果问题持续存在，请尝试清除浏览器缓存或联系技术支持
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
