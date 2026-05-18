import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-screen place-items-center px-4">
          <div className="max-w-md rounded-lg border border-red-400/30 bg-red-400/10 p-5 text-center">
            <h1 className="text-xl font-semibold text-white">Something went wrong</h1>
            <p className="mt-2 text-sm text-red-100">{this.state.error.message || 'Please refresh and try again.'}</p>
            <button className="btn-primary mt-4" onClick={() => window.location.reload()}>Reload</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
