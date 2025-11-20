import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Puedes enviar el error a un servicio de logging si quieres
    this.setState({ error, info });
    console.error('ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-6">
          <div className="max-w-2xl w-full bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-2xl font-bold mb-4">Se produjo un error al renderizar la aplicación</h2>
            <p className="mb-4">Revisa la consola para más detalles. Puedes recargar la página para intentar de nuevo.</p>
            <details className="whitespace-pre-wrap bg-gray-900 p-3 rounded mb-4">
              <summary className="cursor-pointer text-yellow-400">Detalles del error</summary>
              <pre className="text-xs mt-2">{String(this.state.error)}{this.state.info ? '\n\n' + (this.state.info.componentStack || '') : ''}</pre>
            </details>
            <div className="flex gap-3">
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-yellow-400 text-black rounded">Recargar</button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
