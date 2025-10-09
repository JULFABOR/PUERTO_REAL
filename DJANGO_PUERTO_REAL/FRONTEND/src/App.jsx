import { Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProtectedRoute from './auth/ProtectedRoute';
import RoleBasedRedirect from './auth/RoleBasedRedirect';

// Layouts
import EmpleadoLayout from './components/empleado/EmpleadoLayout';
import JefeLayout from './components/jefe/JefeLayout';
import ClienteLayout from './components/cliente/ClienteLayout';

// Page Components
import ClienteHome from './pages/cliente/ClienteHome';
import EmpleadoHome from './pages/empleado/EmpleadoHome';
import VentasPOS from './pages/empleado/pos/VentasPOS';
import Stock from './pages/empleado/stock/Stock';
import Clientes from './pages/empleado/clientes/Clientes';
import Proveedores from './pages/empleado/proveedores/Proveedores';
import Caja from './pages/empleado/caja/Caja';
import JefeHome from './pages/jefe/JefeHome';
import JefeAnalysis from './pages/jefe/JefeAnalysis';
import JefeCaja from './pages/jefe/JefeCaja';
import JefeControlStock from './pages/jefe/JefeControlStock';
import JefeCustomers from './pages/jefe/JefeCustomers';
import JefeStock from './pages/jefe/JefeStock';
import JefeSuppliers from './pages/jefe/JefeSuppliers';
import JefeSettings from './pages/jefe/JefeSettings';


// ... (rest of the file)

function App() {
  return (
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Authenticated Redirector */}
        <Route 
          path="/home" 
          element={
            <ProtectedRoute allowedRoles={['JEFE', 'Gerente de Tienda', 'EMPLEADO', 'CLIENTE']}>
              <RoleBasedRedirect />
            </ProtectedRoute>
          }
        />

        {/* Empleados Routes */}
        <Route 
          path="/empleado" 
          element={
            <ProtectedRoute allowedRoles={['EMPLEADO']}>
              <EmpleadoLayout />
            </ProtectedRoute>
          }
        >
          <Route path="home" element={<EmpleadoHome />} />
          <Route path="pos" element={<VentasPOS />} />
          <Route path="stock" element={<Stock />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="proveedores" element={<Proveedores />} />
          <Route path="caja" element={<Caja />} />
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
          <Route path="analysis" element={<JefeAnalysis />} />
          <Route path="caja" element={<JefeCaja />} />

          <Route path="customers" element={<JefeCustomers />} />
          <Route path="stock" element={<JefeStock />} />
          <Route path="suppliers" element={<JefeSuppliers />} />
          <Route path="settings" element={<JefeSettings />} />
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
        </Route>

      </Routes>
  );
}

export default App;