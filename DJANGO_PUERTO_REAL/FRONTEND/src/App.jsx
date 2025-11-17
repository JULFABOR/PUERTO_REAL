// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProtectedRoute from './auth/ProtectedRoute';
import RoleBasedRedirect from './auth/RoleBasedRedirect';

import { CajaProvider } from './contexts/CajaContext'; // <-- 1. IMPORTAMOS EL PROVIDER

// Layouts
import EmpleadoLayout from './components/empleado/EmpleadoLayout';
import JefeLayout from './components/jefe/JefeLayout';
import ClienteLayout from './components/cliente/ClienteLayout';

// Page Components
import ClienteHome from './pages/cliente/ClienteHome';
import EmpleadoHome from './pages/empleado/EmpleadoHome';
import VentasPOS from './pages/empleado/pos/VentasPOS';
import EmpleadoControlStock from './pages/empleado/control-stock/EmpleadoControlStock';
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

function App() {
  return (
    <CajaProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Authenticated Redirector */}
        <Route 
          path="/home" 
          element={
            <ProtectedRoute allowedRoles={['JEFE', 'EMPLEADO', 'CLIENTE']}>
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
          <Route path="pos" element={<VentasPOS />} /> {/* <--- Esta podrá actualizar la caja */}
          <Route path="control-stock" element={<EmpleadoControlStock />} />
          <Route path="stock" element={<Stock />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="proveedores" element={<Proveedores />} />
          <Route path="caja" element={<Caja />} /> {/* <--- Esta leerá la caja */}
        </Route>

        {/* Jefe Routes */}
        <Route 
          path="/jefe" 
          element={
            <ProtectedRoute allowedRoles={['JEFE',]}>
              <JefeLayout />
            </ProtectedRoute>
          }
        >
          <Route path="home" element={<JefeHome />} />
          <Route path="analysis" element={<JefeAnalysis />} />
          <Route path="caja" element={<JefeCaja />} /> {/* <--- Esta TAMBIÉN leerá la caja */}
          <Route path="control-stock" element={<JefeControlStock />} />
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
    </CajaProvider>
  );
}

export default App;