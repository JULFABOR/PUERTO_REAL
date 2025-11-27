import React, { useState, useEffect } from 'react';
import ConfirmDeleteModal from '@/components/Modals/ConfirmDeleteModal';
import apiClient from '@/api/apiClient';
import { toast } from 'react-hot-toast';
import { UserPlus, Edit, Trash2, KeyRound, Store, Star, Users, User, ServerCrash } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useStore } from '@/contexts/StoreContext'; // <--- 1. IMPORTAR

// Pequeño componente para los íconos de las pestañas
const TabIcon = ({ icon }) => React.createElement(icon, { className: "w-4 h-4 mr-2" });

const JefeSettings = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    
    // Estados para gestión de usuarios
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'cliente' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- 2. USAR EL CONTEXTO DE LA TIENDA ---
    const { storeSettings: contextStoreSettings, updateStoreSettings } = useStore();
    const [storeSettings, setStoreSettings] = useState(contextStoreSettings);
    const [loadingStore, setLoadingStore] = useState(false);

    // Sincronizar el estado local si el contexto cambia
    useEffect(() => {
        setStoreSettings(contextStoreSettings);
    }, [contextStoreSettings]);


    // Estados para la configuración de puntos
    const [pointsSettings, setPointsSettings] = useState({ puntos_por_compra: 0, valor_punto: 0, puntos_por_referido: 0 });
    const [loadingPoints, setLoadingPoints] = useState(false);

    // Estados para el modal de cambio de contraseña
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
    const [passwordData, setPasswordData] = useState({
        old_password: '',
        new_password1: '',
        new_password2: '',
    });

    const { logout, user } = useAuth();
    const api = apiClient;

    // --- MANEJADORES PARA CAMBIO DE CONTRASEÑA ---
    const openChangePasswordModal = () => {
        setPasswordData({ old_password: '', new_password1: '', new_password2: '' });
        setShowChangePasswordModal(true);
    };

    const closeChangePasswordModal = () => {
        setShowChangePasswordModal(false);
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setPasswordChangeLoading(true);
        // Validacion simple en frontend
        if (passwordData.new_password1 !== passwordData.new_password2) {
            toast.error("Las nuevas contraseñas no coinciden.");
            setPasswordChangeLoading(false);
            return;
        }
        if (!passwordData.old_password || !passwordData.new_password1) {
            toast.error("Todos los campos son obligatorios.");
            setPasswordChangeLoading(false);
            return;
        }

        try {
            const response = await api.post('/auth/user/change-password/', passwordData);
            toast.success(response.data.detail || 'Contraseña actualizada. Serás desconectado.');
            closeChangePasswordModal();
            // Forzar logout por seguridad
            setTimeout(() => {
                logout();
            }, 2000);

        } catch (err) {
            console.error("Error cambiando contraseña", err);
            const errorData = err.response?.data;
            if (errorData) {
                // Mapear y mostrar errores específicos del backend
                Object.keys(errorData).forEach(key => {
                    const messages = Array.isArray(errorData[key]) ? errorData[key] : [errorData[key]];
                    messages.forEach(msg => toast.error(msg));
                });
            } else {
                toast.error('Ocurrió un error inesperado.');
            }
        } finally {
            setPasswordChangeLoading(false);
        }
    };


    // --- 0. EFECTO PARA LA TIENDA REMOVIDO, AHORA USA CONTEXTO ---

    // --- 0.5 CARGAR DATOS DE PUNTOS ---
    useEffect(() => {
        const fetchPointsSettings = async () => {
            setLoadingPoints(true);
            try {
                const response = await api.get('/configuracion/configuracion-puntos/');
                setPointsSettings(response.data);
            } catch (err) {
                console.error("Error cargando la configuración de puntos", err);
                toast.error('No se pudo cargar la configuración de puntos.');
            } finally {
                setLoadingPoints(false);
            }
        };

        if (activeTab === 'points') {
            fetchPointsSettings();
        }
    }, [activeTab]);

    // --- 1. CARGAR USUARIOS ---
    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        }
    }, [activeTab]);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/auth/users/');
            setUsers(response.data);
        } catch (err) {
            console.error("Error cargando usuarios", err);
            const status = err.response?.status;
            let errorMessage = 'Error al cargar usuarios. Revisa la consola.';
            if (status === 403) errorMessage = 'No autorizado: tu cuenta no tiene permisos para ver usuarios.';
            else if (status === 401) errorMessage = 'No autorizado: la sesión expiró. Inicia sesión nuevamente.';
            else if (status >= 500) errorMessage = 'Error del servidor al cargar usuarios. Intenta más tarde.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // --- 2. CREAR USUARIO ---
    const handleInputChange = (e) => {
        setNewUser({ ...newUser, [e.target.id]: e.target.value });
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/users/', newUser);
            setUsers([...users, response.data]);
            setNewUser({ username: '', email: '', password: '', role: 'cliente' });
            const createdUsername = response.data?.username || response.data?.user?.username || response.data?.email;
            toast.success(`Usuario registrado: ${createdUsername}`);
        } catch (err) {
            console.error(err);
            const status = err.response?.status;
            const serverMsg = err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message;
            let errorMessage = `Error al crear usuario: ${serverMsg}`;
            if (status === 403) errorMessage = 'No autorizado para crear usuarios.';
            else if (status === 400) errorMessage = 'Datos inválidos. Revisa los campos.';
            else if (status >= 500) errorMessage = 'Error interno del servidor al crear usuario.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // --- 2.5 MANEJAR CAMBIOS Y GUARDAR CONFIGURACIÓN DE TIENDA ---
    const handleStoreSettingsChange = (e) => {
        setStoreSettings({ ...storeSettings, [e.target.name]: e.target.value });
    };

    const handleSaveStoreSettings = async (e) => {
        e.preventDefault();
        setLoadingStore(true);
        try {
            const response = await api.put('/configuracion/configuracion-tienda/', storeSettings);
            updateStoreSettings(response.data); // <-- 3. ACTUALIZAR EL CONTEXTO
            toast.success('¡Configuración de la tienda guardada!');
        } catch (err) {
            console.error("Error guardando la configuración de la tienda", err);
            toast.error(err.response?.data?.detail || 'No se pudo guardar la configuración.');
        } finally {
            setLoadingStore(false);
        }
    };

    // --- 2.6 MANEJAR CAMBIOS Y GUARDAR CONFIGURACIÓN DE PUNTOS ---
    const handlePointsSettingsChange = (e) => {
        setPointsSettings({ ...pointsSettings, [e.target.name]: e.target.value });
    };

    const handleSavePointsSettings = async (e) => {
        e.preventDefault();
        setLoadingPoints(true);
        try {
            const response = await api.put('/configuracion/configuracion-puntos/', pointsSettings);
            setPointsSettings(response.data);
            toast.success('¡Reglas de puntos guardadas!');
        } catch (err) {
            console.error("Error guardando las reglas de puntos", err);
            toast.error(err.response?.data?.detail || 'No se pudo guardar la configuración de puntos.');
        } finally {
            setLoadingPoints(false);
        }
    };

    // --- 3. ELIMINAR USUARIO ---
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    // --- 4. EDITAR USUARIO (INLINE) ---
    const [editingUserId, setEditingUserId] = useState(null);
    const [editingUserData, setEditingUserData] = useState(null);

    const handleEditClick = (user) => {
        setEditingUserId(user.id);
        // Guardamos los datos originales del perfil por si se cancela
        setEditingUserData({ 
            username: user.username, 
            email: user.email, 
            role: user.perfil?.rol?.toLowerCase() || 'cliente' 
        });
    };

    const handleCancelEdit = () => {
        setEditingUserId(null);
        setEditingUserData(null);
    };

    const handleEditingUserChange = (e) => {
        setEditingUserData({ ...editingUserData, [e.target.name]: e.target.value });
    };

    const handleUpdateUser = async (userId) => {
        if (!editingUserData) return;
        setLoading(true); // Reutilizamos el loading general
        try {
            const response = await api.put(`/auth/users/${userId}/`, editingUserData);
            // Actualizamos la lista de usuarios con los nuevos datos
            setUsers(users.map(u => u.id === userId ? response.data : u));
            toast.success('¡Usuario actualizado con éxito!');
            handleCancelEdit(); // Salimos del modo edición
        } catch (err) {
            console.error("Error actualizando usuario", err);
            const serverMsg = err.response?.data?.detail || 'No se pudo actualizar el usuario.';
            toast.error(serverMsg);
        } finally {
            setLoading(false);
        }
    };

    const openConfirmDelete = (user) => {
        setUserToDelete(user);
        setShowConfirmDelete(true);
    };

    const closeConfirmDelete = () => {
        setUserToDelete(null);
        setShowConfirmDelete(false);
    };

    const handleDeleteUser = async (id) => {
        try {
            await api.delete(`/auth/users/${id}/`);
            setUsers(users.filter(u => u.id !== id));
            toast.success('Usuario eliminado correctamente.');
        } catch (err) {
            const status = err.response?.status;
            const serverMsg = err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message;
            let errorMessage = `Error al eliminar: ${serverMsg}`;
            if (status === 403) errorMessage = 'No autorizado para eliminar usuarios.';
            else if (status === 404) errorMessage = 'Usuario no encontrado.';
            setError(errorMessage);
            toast.error(errorMessage);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'profile': return <ProfileSettings onOpenChangePassword={openChangePasswordModal} user={user} />;
            case 'store': return <StoreSettings 
                settings={storeSettings}
                loading={loadingStore}
                onChange={handleStoreSettingsChange}
                onSave={handleSaveStoreSettings}
            />;
            case 'points': return <PointsSettings
                settings={pointsSettings}
                loading={loadingPoints}
                onChange={handlePointsSettingsChange}
                onSave={handleSavePointsSettings}
            />;
            case 'users': return <UserManagement 
                users={users} 
                newUser={newUser}
                loading={loading}
                error={error}
                handleInputChange={handleInputChange}
                handleCreateUser={handleCreateUser}
                openConfirmDelete={openConfirmDelete}
                // Props para edición inline
                editingUserId={editingUserId}
                editingUserData={editingUserData}
                onEditClick={handleEditClick}
                onCancelEdit={handleCancelEdit}
                onUpdateUser={handleUpdateUser}
                onEditingChange={handleEditingUserChange}
            />;
            default: return null;
        }
    }

    return (
        <>
            <h1 className="text-3xl font-bold text-white mb-6">Panel de Configuración</h1>

            <div className="mb-6 border-b border-gray-700">
                <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
                    {[
                        { id: 'profile', label: 'Mi Perfil', icon: User },
                        { id: 'store', label: 'Tienda', icon: Store },
                        { id: 'points', label: 'Puntos', icon: Star },
                        { id: 'users', label: 'Usuarios', icon: Users },
                    ].map(tab => (
                        <li key={tab.id} className="me-2">
                            <button onClick={() => setActiveTab(tab.id)} className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg transition-colors ${activeTab === tab.id ? 'text-pr-yellow border-pr-yellow' : 'text-gray-400 border-transparent hover:text-gray-300 hover:border-gray-500'}`}>
                                <TabIcon icon={tab.icon} />
                                {tab.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <div>{renderContent()}</div>
            
            <ConfirmDeleteModal
                isOpen={showConfirmDelete}
                onClose={closeConfirmDelete}
                onConfirm={async () => {
                    if (!userToDelete) return closeConfirmDelete();
                    await handleDeleteUser(userToDelete.id);
                    closeConfirmDelete();
                }}
                itemName={userToDelete?.username || userToDelete?.email || 'este usuario'}
            />

            <ChangePasswordModal
                isOpen={showChangePasswordModal}
                onClose={closeChangePasswordModal}
                onConfirm={handleUpdatePassword}
                loading={passwordChangeLoading}
                passwordData={passwordData}
                onFieldChange={handlePasswordChange}
            />
        </>
    );
};

// Componentes para cada pestaña para mayor claridad

const ProfileSettings = ({ onOpenChangePassword, user }) => {
    // La lógica de estado para este componente se podría mover aquí si se refactoriza más
    const [loading, setLoading] = useState(false);
    // const userData = JSON.parse(localStorage.getItem('userData')) || {}; // No longer needed, using prop

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        const username = (e.target.username?.value || '').trim();
        const email = (e.target.email?.value || '').trim();
        if (!username || !email) {
            toast.error('Nombre de usuario y email son obligatorios');
            setLoading(false); return;
        }
        try {
            const res = await apiClient.put('/auth/user/me/', { username, email });
            toast.success('Perfil actualizado con éxito.');
             // Opcional: actualizar localStorage si el backend no fuerza relogin
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Error al actualizar el perfil.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="bg-pr-dark p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
             <h2 className="text-2xl font-bold text-white mb-6">Mi Perfil</h2>
             <div className="flex items-center gap-6 mb-8">
                <img src={`https://ui-avatars.com/api/?name=${user?.username}&background=FFC700&color=121212&bold=true&size=80`} alt="Avatar" className="w-20 h-20 rounded-full border-4 border-pr-yellow" />
                <div>
                    <div className="font-bold text-xl text-white">{user?.username}</div>
                    <div className="text-gray-400">{user?.email}</div>
                    <span className="inline-block mt-2 px-3 py-1 rounded-full bg-pr-yellow/10 text-pr-yellow text-xs font-bold">{user?.rol}</span>
                </div>
            </div>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Nombre de usuario" name="username" defaultValue={user?.username} />
                    <InputField label="Email" name="email" type="email" defaultValue={user?.email} />
                </div>
                <div className="flex items-center gap-4 pt-4">
                    <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Guardando...' : 'Guardar Cambios'}</button>
                    {/* El botón de cambiar contraseña podría abrir otro modal o ir a otra vista */}
                    <button type="button" onClick={onOpenChangePassword} className="btn-secondary flex items-center"><KeyRound className="w-4 h-4 mr-2"/> Cambiar Contraseña</button>
                </div>
            </form>
        </div>
    );
};

const StoreSettings = ({ settings, loading, onChange, onSave }) => {
    // Lógica para cargar y guardar la configuración de la tienda
    return (
        <div className="bg-pr-dark p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Configuración de la Tienda</h2>
            <form onSubmit={onSave} className="space-y-4">
                 <InputField label="Nombre de la Tienda" name="nombre_tienda" value={settings.nombre_tienda || ''} onChange={onChange} />
                 <InputField label="Dirección" name="direccion" value={settings.direccion || ''} onChange={onChange} />
                 <InputField label="Teléfono" name="telefono" value={settings.telefono || ''} onChange={onChange} />
                 <div className="pt-4">
                    <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Guardando...' : 'Guardar Cambios'}</button>
                 </div>
            </form>
        </div>
    );
}

const PointsSettings = ({ settings, loading, onChange, onSave }) => {
    // Lógica para cargar y guardar la configuración de puntos
    return (
        <div className="bg-pr-dark p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Reglas de Puntos de Fidelidad</h2>
            <form onSubmit={onSave} className="space-y-4">
                 <InputField 
                    label="Factor de Puntos por Compra" 
                    name="puntos_por_compra" 
                    type="number" 
                    value={settings.puntos_por_compra || ''} 
                    onChange={onChange}
                    step="0.01"
                 />
                 <InputField 
                    label="Valor de 1 Punto (en $)" 
                    name="valor_punto" 
                    type="number" 
                    value={settings.valor_punto || ''} 
                    onChange={onChange} 
                    step="0.01"
                 />
                 <InputField 
                    label="Puntos por Cliente Referido" 
                    name="puntos_por_referido" 
                    type="number" 
                    value={settings.puntos_por_referido || ''} 
                    onChange={onChange} 
                 />
                 <div className="pt-4">
                    <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Guardando...' : 'Guardar Cambios'}</button>
                 </div>
            </form>
        </div>
    );
}

const UserManagement = ({ 
    users, newUser, loading, error, handleInputChange, handleCreateUser, openConfirmDelete,
    editingUserId, editingUserData, onEditClick, onCancelEdit, onUpdateUser, onEditingChange
}) => {
    
    const RoleBadge = ({ role }) => {
        const normalizedRole = role?.toUpperCase();
        const styles = {
            JEFE: 'bg-red-900 text-red-300 border border-red-700',
            EMPLEADO: 'bg-blue-900 text-blue-300 border border-blue-700',
            CLIENTE: 'bg-green-900 text-green-300 border border-green-700',
        };
        const style = styles[normalizedRole] || 'bg-gray-700 text-gray-300 border border-gray-600';
        return <span className={`px-2 py-1 rounded-full text-xs font-bold ${style}`}>{normalizedRole}</span>;
    };

    const renderUserRow = (user) => {
        const isEditing = editingUserId === user.id;

        if (isEditing) {
            return (
                <tr key={user.id} className="bg-pr-yellow/10 border-b border-pr-yellow">
                    {/* Columna de Usuario y Email (Inputs) */}
                    <td className="px-6 py-4">
                        <input 
                            type="text"
                            name="username"
                            value={editingUserData.username}
                            onChange={onEditingChange}
                            className="input-field input-field-sm"
                            placeholder="Nombre de usuario"
                        />
                        <input 
                            type="email"
                            name="email"
                            value={editingUserData.email}
                            onChange={onEditingChange}
                            className="input-field input-field-sm mt-1"
                            placeholder="Email"
                        />
                    </td>
                    {/* Columna de Rol (Select) */}
                    <td className="px-6 py-4">
                        <select 
                            name="role" 
                            value={editingUserData.role} 
                            onChange={onEditingChange} 
                            className="input-field input-field-sm"
                        >
                            <option value="cliente">Cliente</option>
                            <option value="empleado">Empleado</option>
                            <option value="jefe">Jefe</option>
                        </select>
                    </td>
                    {/* Columna de Acciones (Guardar/Cancelar) */}
                    <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                            <button onClick={() => onUpdateUser(user.id)} className="btn-primary btn-sm" disabled={loading}>
                                {loading ? '...' : 'Guardar'}
                            </button>
                            <button onClick={onCancelEdit} className="btn-secondary btn-sm" disabled={loading}>
                                Cancelar
                            </button>
                        </div>
                    </td>
                </tr>
            );
        }

        // --- Fila normal (solo visualización) ---
        return (
            <tr key={user.id} className="border-b border-gray-700 hover:bg-pr-dark-gray transition-colors">
                <td className="px-6 py-4">
                    <div className="font-bold text-white">{user.username}</div>
                    <div className="text-xs text-gray-400">{user.email}</div>
                </td>
                <td className="px-6 py-4">
                    <RoleBadge role={user.perfil?.rol} />
                </td>
                <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <button onClick={() => onEditClick(user)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors" disabled={editingUserId !== null}>
                            <Edit className="w-4 h-4"/>
                        </button>
                        <button onClick={() => openConfirmDelete(user)} className="p-2 text-red-500 hover:text-red-400 hover:bg-red-900/50 rounded-full transition-colors" disabled={editingUserId !== null}>
                            <Trash2 className="w-4 h-4"/>
                        </button>
                    </div>
                </td>
            </tr>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* COLUMNA DE CREACIÓN */}
            <div className="lg:col-span-1">
                 <div className="bg-pr-dark p-6 rounded-lg shadow-lg sticky top-6">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center"><UserPlus className="w-5 h-5 mr-3 text-pr-yellow"/>Crear Nuevo Usuario</h2>
                    {error && <div className="p-3 mb-4 text-sm text-red-200 bg-red-900/50 rounded-lg border border-red-700">{error}</div>}
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <InputField id="username" label="Nombre de Usuario" placeholder="Ej: juanperez" value={newUser.username} onChange={handleInputChange} required />
                        <InputField id="email" label="Email" type="email" placeholder="usuario@puertoreal.com" value={newUser.email} onChange={handleInputChange} required />
                        <InputField id="password" label="Contraseña" type="password" placeholder="••••••••" value={newUser.password} onChange={handleInputChange} required />
                        <div>
                            <label htmlFor="role" className="block mb-2 text-sm font-medium text-gray-300">Rol</label>
                            <select id="role" value={newUser.role} onChange={handleInputChange} className="input-field">
                                <option value="cliente">Cliente</option>
                                <option value="empleado">Empleado</option>
                                <option value="jefe">Jefe</option>
                            </select>
                        </div>
                        <button type="submit" disabled={loading} className="w-full btn-primary mt-2">{loading ? 'Registrando...' : 'Registrar Usuario'}</button>
                    </form>
                </div>
            </div>

            {/* COLUMNA DE TABLA */}
            <div className="lg:col-span-2">
                 <div className="bg-pr-dark p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold text-white mb-4">Usuarios Registrados</h2>
                     <div className="relative overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-gray-400 uppercase bg-pr-dark-gray">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Usuario</th>
                                    <th scope="col" className="px-6 py-3">Rol</th>
                                    <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && !users.length ? (
                                    <tr><td colSpan="3" className="text-center py-8">Cargando usuarios...</td></tr>
                                ) : !loading && !users.length ? (
                                    <tr><td colSpan="3" className="text-center py-8">
                                        <div className="flex flex-col items-center justify-center text-gray-500">
                                            <ServerCrash className="w-10 h-10 mb-2"/>
                                            <p className="font-bold">No se encontraron usuarios</p>
                                            <p className="text-xs">{error || "Intenta crear uno para empezar."}</p>
                                        </div>
                                    </td></tr>
                                ) : (
                                    users.map(renderUserRow)
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Componente reutilizable para campos de formulario
const InputField = ({ id, label, type = 'text', ...props }) => (
    <div>
        <label htmlFor={id || props.name} className="block mb-2 text-sm font-medium text-gray-300">{label}</label>
        <input type={type} id={id || props.name} className="input-field" {...props} />
    </div>
);

const ChangePasswordModal = ({ isOpen, onClose, onConfirm, loading, passwordData, onFieldChange }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
            <div className="bg-pr-dark rounded-lg shadow-xl p-6 w-full max-w-md m-4">
                <h2 className="text-2xl font-bold text-white mb-4">Cambiar Contraseña</h2>
                <form onSubmit={onConfirm} className="space-y-4">
                    <InputField
                        label="Contraseña Actual"
                        name="old_password"
                        type="password"
                        value={passwordData.old_password}
                        onChange={onFieldChange}
                        required
                        autoComplete="current-password"
                    />
                    <InputField
                        label="Nueva Contraseña"
                        name="new_password1"
                        type="password"
                        value={passwordData.new_password1}
                        onChange={onFieldChange}
                        required
                        autoComplete="new-password"
                    />
                    <InputField
                        label="Confirmar Nueva Contraseña"
                        name="new_password2"
                        type="password"
                        value={passwordData.new_password2}
                        onChange={onFieldChange}
                        required
                        autoComplete="new-password"
                    />
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default JefeSettings;

