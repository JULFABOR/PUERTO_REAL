import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import ControlStockPage from './pages/ControlStockPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const managerRoles = ['Gerente de Tienda']; // Roles que pueden ver estas páginas

  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública para el Login */}
        <Route path="/" element={<AuthPage />} />

        {/* Rutas Protegidas */}
        <Route 
          path="/home" 
          element={
            <ProtectedRoute allowedRoles={managerRoles}>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/control-stock" 
          element={
            <ProtectedRoute allowedRoles={managerRoles}>
              <ControlStockPage />
            </ProtectedRoute>
          }
        />

        {/* Aquí se añadirían más rutas protegidas o públicas */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;