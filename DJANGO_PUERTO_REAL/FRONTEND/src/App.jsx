// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'; // <--- AGREGADO "Navigate"
import AuthPage from './pages/AuthPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProtectedRoute from './auth/ProtectedRoute';
import RoleBasedRedirect from './auth/RoleBasedRedirect';

import { CajaProvider } from './contexts/CajaContext';

// Layouts
import EmpleadoLayout from './components/empleado/EmpleadoLayout';
import JefeLayout from './components/jefe/JefeLayout';
import ClienteLayout from './components/cliente/ClienteLayout';

// Page Components
import ClienteHome from './pages/cliente/ClienteHome';
import PromocionesPage from './pages/promociones/PromocionesPage'; // <--- AGREGADO
import EmpleadoHome from './pages/empleado/EmpleadoHome';
import VentasPOS from './pages/empleado/pos/VentasPOS';
import EmpleadoControlStock from './pages/empleado/control-stock/EmpleadoControlStock';
import Stock from './pages/empleado/stock/Stock';
import Clientes from './pages/empleado/clientes/Clientes';
import Proveedores from './pages/empleado/proveedores/Proveedores';
import Caja from './pages/empleado/caja/Caja';
import JefeHome from './pages/jefe/JefeHome.jsx';
import JefeAnalysis from './pages/jefe/JefeAnalysis.jsx';
import JefeCaja from './pages/jefe/JefeCaja.jsx';
import JefeControlStock from './pages/jefe/JefeControlStock.jsx';
import JefeCustomers from './pages/jefe/JefeCustomers.jsx';
import JefeStock from './pages/jefe/JefeStock.jsx';
import JefeSuppliers from './pages/jefe/JefeSuppliers.jsx';
import JefeSettings from './pages/jefe/JefeSettings.jsx';

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
              <CajaProvider>
                <EmpleadoLayout />
              </CajaProvider>
            </ProtectedRoute>
          }
        >
          {/* SOLUCIÓN: Si entran a "/empleado", los manda a "/empleado/home" */}
          <Route index element={<Navigate to="home" replace />} />
          
          <Route path="home" element={<EmpleadoHome />} />
          <Route path="pos" element={<VentasPOS />} />
          <Route path="control-stock" element={<EmpleadoControlStock />} />
          <Route path="stock" element={<Stock />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="proveedores" element={<Proveedores />} />
          <Route path="caja" element={<Caja />} />
        </Route>
        
        {/* Jefe Routes */}
        <Route
          path="/jefe" 
          element={
            <ProtectedRoute allowedRoles={['JEFE']}>
              <CajaProvider>
                <JefeLayout />
              </CajaProvider>
            </ProtectedRoute>
          }  
        >
          {/* SOLUCIÓN: Si entran a "/jefe", los manda a "/jefe/home" */}
          <Route index element={<Navigate to="home" replace />} />

          <Route path="home" element={<JefeHome />} />
          <Route path="analysis" element={<JefeAnalysis />} />
          <Route path="caja" element={<JefeCaja />} />
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
          {/* SOLUCIÓN: Si entran a "/cliente", los manda a "/cliente/home" */}
          <Route index element={<Navigate to="home" replace />} />
          
          <Route path="home" element={<ClienteHome />} />
          <Route path="promociones" element={<PromocionesPage />} />
        </Route>

        {/* Catch all - Opcional: Para rutas no encontradas */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
  );
}

export default App;