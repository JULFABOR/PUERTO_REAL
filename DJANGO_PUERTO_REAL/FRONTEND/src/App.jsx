import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRedirect from './components/RoleBasedRedirect';

// Layouts
import EmpleadoLayout from './components/empleado/EmpleadoLayout';
import JefeLayout from './components/jefe/JefeLayout';
import ClienteLayout from './components/cliente/ClienteLayout';

// Pages
import EmpleadoHome from './pages/empleado/EmpleadoHome';
import POSPage from './pages/empleado/POSPage';
import ControlStockPage from './pages/empleado/ControlStockPage';
import JefeHome from './pages/jefe/JefeHome';
import ClienteHome from './pages/cliente/ClienteHome';

// NOTE: The old HomePage and ControlStockPage are currently not used in this new structure.
// They will be replaced by role-specific pages.

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<AuthPage />} />

        {/* Authenticated Redirector */}
        <Route 
          path="/home" 
          element={
            <ProtectedRoute allowedRoles={['JEFE', 'Gerente de Tienda', 'EMPLEADO', 'CLIENTE']}>
              <RoleBasedRedirect />
            </ProtectedRoute>
          }
        />

        {/* Employee Routes */}
        <Route 
          path="/empleado" 
          element={
            <ProtectedRoute allowedRoles={['EMPLEADO']}>
              <EmpleadoLayout />
            </ProtectedRoute>
          }
        >
          <Route path="home" element={<EmpleadoHome />} />
          <Route path="pos" element={<POSPage />} />
          <Route path="control-stock" element={<ControlStockPage />} />
          {/* Add other employee pages here, e.g.: */}
          {/* <Route path="pos" element={<PosPage />} /> */}
        </Route>

        {/* Jefe Routes */}
        <Route 
          path="/jefe" 
          element={
            <ProtectedRoute allowedRoles={['JEFE', 'Gerente de Tienda']}>
              <JefeLayout />
            </ProtectedRoute>
          }
        >
          <Route path="home" element={<JefeHome />} />
          {/* Add other jefe pages here */}
        </Route>

        {/* Cliente Routes */}
        <Route 
          path="/cliente" 
          element={
            <ProtectedRoute allowedRoles={['CLIENTE']}>
              <ClienteLayout />
            </ProtectedRoute>
          }
        >
          <Route path="home" element={<ClienteHome />} />
          {/* Add other cliente pages here */}
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
