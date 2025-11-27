import React, { useState, useEffect } from 'react';
import ConfirmDeleteModal from '@/components/Modals/ConfirmDeleteModal';
import apiClient from '@/api/apiClient';
import { toast } from 'react-hot-toast';


const JefeSettings = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    
    // Estados para gestión de usuarios
    const [users, setUsers] = useState([]);
    const initialUserState = { username: '', email: '', password: '', role: 'cliente' };
    const [formUser, setFormUser] = useState(initialUserState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Estados para saber si estamos editando
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Usamos la instancia compartida `apiClient` que ya maneja baseURL y Authorization
    const api = apiClient;

    // --- 1. CARGAR USUARIOS ---
    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        }
    }, [activeTab]);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/auth/users/');
            console.debug('fetchUsers response:', response?.data);
            setUsers(response.data);
        } catch (err) {
            console.error("Error cargando usuarios", err);
            const status = err.response?.status;
            if (status === 403) {
                setError('No autorizado: tu cuenta no tiene permisos para ver usuarios.');
            } else if (status === 401) {
                setError('No autorizado: la sesión expiró. Inicia sesión nuevamente.');
            } else if (status >= 500) {
                setError('Error del servidor al cargar usuarios. Intenta más tarde.');
            } else {
                setError('Error al cargar usuarios. Revisa la consola para más detalles.');
            }
        }
    };

    // --- 2. CREAR O EDITAR USUARIO ---
    const handleInputChange = (e) => {
        setFormUser({ ...formUser, [e.target.id]: e.target.value });
    };

    // --- PREPARAR EDICIÓN (Al hacer clic en "Editar") ---
    const handleEditClick = (user) => {
        setError(null);
        setIsEditing(true);
        setEditingId(user.id);
        
        // Rellenamos el form (Password vacío por seguridad)
        setFormUser({
            username: user.username,
            email: user.email,
            role: user.role || user.perfil?.rol || 'cliente',
            password: '' 
        });
    };

    // --- CANCELAR EDICIÓN ---
    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditingId(null);
        setFormUser(initialUserState);
        setError(null);
    };

    // --- ENVIAR FORMULARIO (Sirve para CREAR y EDITAR) ---
    const handleSubmitUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isEditing) {
                // EDITAR (PUT)
                const payload = { ...formUser };
                if (!payload.password) delete payload.password; // No enviar pass si está vacío

                const response = await api.put(`/auth/users/${editingId}/`, payload);
                
                // Actualizar lista local
                setUsers(users.map(u => u.id === editingId ? response.data : u));
                toast.success('Usuario actualizado.');
                handleCancelEdit();
            } else {
                // CREAR (POST)
                const response = await api.post('/auth/users/', formUser);
                console.debug('create user response:', response?.data);
                setUsers([...users, response.data]);
                const createdUsername = response.data?.username || response.data?.user?.username || response.data?.email;
                toast.success(`Usuario registrado: ${createdUsername}`);
                setFormUser(initialUserState);
            }
        } catch (err) {
            console.error(err);
            const status = err.response?.status;
            const serverMsg = err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message;
            if (status === 403) {
                setError('No autorizado para crear/editar usuarios.');
                toast.error('No autorizado para crear/editar usuarios.');
            } else if (status === 400) {
                setError('Datos inválidos. Revisa los campos.');
                toast.error(`Error: ${serverMsg}`);
            } else if (status >= 500) {
                setError('Error interno del servidor.');
                toast.error('Error interno del servidor.');
            } else {
                setError('Ocurrió un error al procesar la solicitud.');
                toast.error(`Error: ${serverMsg}`);
            }
        } finally {
            setLoading(false);
        }
    };

    // --- 3. ELIMINAR USUARIO (Usando modal de confirmación) ---
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

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
            if (status === 403) {
                setError('No autorizado para eliminar usuarios.');
                toast.error('No autorizado para eliminar usuarios.');
            } else if (status === 404) {
                setError('Usuario no encontrado.');
                toast.error('Usuario no encontrado.');
            } else {
                setError('Error al eliminar usuario.');
                toast.error(`Error al eliminar: ${serverMsg}`);
            }
        }
    };

    return (
        <>
            <h1 className="text-3xl font-bold text-white mb-6">Configuración</h1>

            {/* NAVEGACIÓN DE TABS */}
            <div className="mb-4 border-b border-gray-700">
                <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
                    <li className="me-2">
                        <button onClick={() => setActiveTab('profile')} className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 'profile' ? 'text-pr-yellow border-pr-yellow' : 'text-gray-300 hover:text-white'}`}>Mi Perfil</button>
                    </li>
                    <li className="me-2">
                        <button onClick={() => setActiveTab('store')} className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 'store' ? 'text-pr-yellow border-pr-yellow' : 'text-gray-300 hover:text-white'}`}>Tienda</button>
                    </li>
                    <li className="me-2">
                        <button onClick={() => setActiveTab('points')} className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 'points' ? 'text-pr-yellow border-pr-yellow' : 'text-gray-300 hover:text-white'}`}>Puntos</button>
                    </li>
                    <li className="me-2">
                        <button onClick={() => setActiveTab('users')} className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 'users' ? 'text-pr-yellow border-pr-yellow' : 'text-gray-300 hover:text-white'}`}>Usuarios</button>
                    </li>
                </ul>
            </div>

            {/* CONTENIDO DE TABS EXISTENTES (Resumido para ahorrar espacio) */}
            {activeTab === 'profile' && (
                <div className="p-4 rounded-lg bg-pr-dark text-white flex flex-col gap-6 max-w-xl mx-auto">
                    <h2 className="text-2xl font-bold mb-2">Mi Perfil</h2>
                    <div className="flex items-center gap-6 mb-4">
                        <img src="https://placehold.co/80x80/FFC700/121212?text=J" alt="Avatar" className="w-20 h-20 rounded-full border-4 border-pr-yellow shadow" />
                        <div>
                            <div className="font-bold text-xl">{JSON.parse(localStorage.getItem('userData'))?.username || 'Usuario'}</div>
                            <div className="text-gray-300">{JSON.parse(localStorage.getItem('userData'))?.email || 'Sin email'}</div>
                            <span className="inline-block mt-2 px-3 py-1 rounded-full bg-pr-yellow/10 text-pr-yellow text-xs font-bold">{JSON.parse(localStorage.getItem('userData'))?.rol || 'JEFE'}</span>
                        </div>
                    </div>
                    <form className="flex flex-col gap-4" onSubmit={async e => {
                        e.preventDefault();
                        setLoading(true);
                        const username = (e.target.username?.value || '').trim();
                        const email = (e.target.email?.value || '').trim();
                        const password = e.target.password?.value || '';
                        // Validación básica
                        if (!username) {
                            toast.error('El nombre de usuario es obligatorio');
                            setLoading(false); return;
                        }
                        if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
                            toast.error('Email inválido');
                            setLoading(false); return;
                        }
                        try {
                            const res = await apiClient.put('/auth/user/me/', {
                                username,
                                email,
                                ...(password ? { password } : {})
                            });

                            // Si el backend indica que el usuario debe reloguear, borramos token y redirigimos
                            if (res.data && res.data.force_logout) {
                                toast.success(res.data.detail || 'Perfil actualizado. Vuelve a iniciar sesión.');
                                localStorage.removeItem('authToken');
                                localStorage.removeItem('userData');
                                // Redirigir al login principal
                                window.location.href = '/login';
                                return;
                            }

                            toast.success('Perfil actualizado');
                        } catch (err) {
                            toast.error('Error al actualizar perfil');
                        } finally {
                            setLoading(false);
                        }
                    }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre de usuario</label>
                                <input name="username" defaultValue={JSON.parse(localStorage.getItem('userData'))?.username || ''} className="border rounded-lg p-2 w-full bg-pr-dark-gray border-gray-600 text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input name="email" defaultValue={JSON.parse(localStorage.getItem('userData'))?.email || ''} className="border rounded-lg p-2 w-full bg-pr-dark-gray border-gray-600 text-white" />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Guardando...' : 'Guardar cambios'}</button>
                            <button type="button" className="btn-secondary" onClick={() => {
                                setResetEmail(JSON.parse(localStorage.getItem('userData'))?.email || '');
                                setShowPasswordModal(true);
                            }}>Cambiar contraseña</button>
                        </div>
                    </form>
                    {/* Modal para recuperación de contraseña */}
                    {showPasswordModal && (
                        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-60 z-50 flex items-center justify-center">
                            <div className="bg-pr-dark rounded-lg shadow-lg p-6 w-full max-w-md border border-pr-yellow">
                                <h3 className="text-xl font-bold mb-4 text-pr-yellow">Recuperar contraseña</h3>
                                <form onSubmit={async e => {
                                    e.preventDefault();
                                    setResetLoading(true);
                                    if (!resetEmail.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
                                        toast.error('Email inválido');
                                        setResetLoading(false); return;
                                    }
                                    try {
                                        await apiClient.post('/auth/password-reset/', { email: resetEmail });
                                        toast.success('Enlace de recuperación enviado');
                                        setShowPasswordModal(false);
                                    } catch (err) {
                                        toast.error('Error al enviar recuperación');
                                    } finally {
                                        setResetLoading(false);
                                    }
                                }} className="flex flex-col gap-4">
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} className="border rounded-lg p-2 w-full bg-pr-dark-gray border-gray-600 text-white" required />
                                    <div className="flex gap-2 mt-2">
                                        <button type="submit" className="btn-primary" disabled={resetLoading}>{resetLoading ? 'Enviando...' : 'Enviar enlace'}</button>
                                        <button type="button" className="btn-secondary" onClick={() => setShowPasswordModal(false)}>Cancelar</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {activeTab === 'store' && (
                <div className="p-4 rounded-lg bg-pr-dark text-white flex flex-col gap-4">
                    <h2 className="text-xl font-bold mb-2">Configuración de Tienda</h2>
                    <form className="flex flex-col gap-2" onSubmit={async e => {
                        e.preventDefault();
                        setLoading(true);
                        try {
                            // Simulación: Actualizar datos de tienda
                            await apiClient.put('/configuracion/tienda/', {
                                nombre: e.target.nombre.value,
                                direccion: e.target.direccion.value,
                                telefono: e.target.telefono.value
                            });
                            toast.success('Datos de tienda actualizados');
                        } catch (err) {
                            toast.error('Error al actualizar tienda');
                        } finally {
                            setLoading(false);
                        }
                    }}>
                        <div className="mb-2">
                            <label className="block text-sm font-medium mb-1">Nombre de la tienda</label>
                            <input name="nombre" type="text" className="border rounded-lg p-2 w-full bg-pr-dark-gray border-gray-600 text-white" defaultValue="Puerto Real" />
                        </div>
                        <div className="mb-2">
                            <label className="block text-sm font-medium mb-1">Dirección</label>
                            <input name="direccion" type="text" className="border rounded-lg p-2 w-full bg-pr-dark-gray border-gray-600 text-white" defaultValue="Av. Principal 123" />
                        </div>
                        <div className="mb-2">
                            <label className="block text-sm font-medium mb-1">Teléfono</label>
                            <input name="telefono" type="text" className="border rounded-lg p-2 w-full bg-pr-dark-gray border-gray-600 text-white" defaultValue="(011) 1234-5678" />
                        </div>
                        <button type="submit" className="btn-primary mt-2">Guardar cambios</button>
                    </form>
                </div>
            )}
            {activeTab === 'points' && (
                <div className="p-4 rounded-lg bg-pr-dark text-white flex flex-col gap-4">
                    <h2 className="text-xl font-bold mb-2">Reglas de Puntos</h2>
                    <form className="flex flex-col gap-2" onSubmit={async e => {
                        e.preventDefault();
                        setLoading(true);
                        try {
                            // Simulación: Actualizar reglas de puntos
                            await apiClient.put('/configuracion/puntos/', {
                                puntos_compra: e.target.puntos_compra.value,
                                puntos_referido: e.target.puntos_referido.value
                            });
                            toast.success('Reglas de puntos actualizadas');
                        } catch (err) {
                            toast.error('Error al actualizar reglas de puntos');
                        } finally {
                            setLoading(false);
                        }
                    }}>
                        <div className="mb-2">
                            <label className="block text-sm font-medium mb-1">Puntos por compra</label>
                            <input name="puntos_compra" type="number" className="border rounded-lg p-2 w-full bg-pr-dark-gray border-gray-600 text-white" defaultValue={10} />
                        </div>
                        <div className="mb-2">
                            <label className="block text-sm font-medium mb-1">Puntos por referidos</label>
                            <input name="puntos_referido" type="number" className="border rounded-lg p-2 w-full bg-pr-dark-gray border-gray-600 text-white" defaultValue={20} />
                        </div>
                        <button type="submit" className="btn-primary mt-2">Guardar cambios</button>
                    </form>
                </div>
            )}

            {/* --- NUEVA PESTAÑA: USUARIOS --- */}
            {activeTab === 'users' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* FORMULARIO DE CREACIÓN */}
                    <div className="p-4 rounded-lg bg-pr-dark h-fit">
                        <h2 className="text-xl font-bold text-white mb-4">{isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h2>
                        
                        {error && <div className="p-3 mb-4 text-sm text-red-200 bg-red-900 rounded-lg">{error}</div>}

                        <form onSubmit={handleSubmitUser} className="space-y-4">
                            <div>
                                <label htmlFor="username" className="block mb-2 text-sm font-medium text-white">Nombre de Usuario</label>
                                <input 
                                    onChange={handleInputChange} 
                                    value={formUser.username} 
                                    type="text" 
                                    id="username" 
                                    className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-600 text-white placeholder-gray-400" 
                                    placeholder="Ej: juanperez" 
                                    required 
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block mb-2 text-sm font-medium text-white">Email</label>
                                <input 
                                    onChange={handleInputChange} 
                                    value={formUser.email} 
                                    type="email" 
                                    id="email" 
                                    className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-600 text-white placeholder-gray-400" 
                                    placeholder="usuario@puertoreal.com" 
                                    required 
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block mb-2 text-sm font-medium text-white">Contraseña {isEditing && <span className="text-gray-300">(Dejar vacío para no cambiar)</span>}</label>
                                <input 
                                    onChange={handleInputChange} 
                                    value={formUser.password} 
                                    type="password" 
                                    id="password" 
                                    className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-600 text-white" 
                                    placeholder="••••••••" 
                                    required={!isEditing}
                                />
                            </div>
                            <div>
                                <label htmlFor="role" className="block mb-2 text-sm font-medium text-white">Rol</label>
                                <select 
                                    onChange={handleInputChange} 
                                    value={formUser.role} 
                                    id="role" 
                                    className="border text-sm rounded-lg block w-full p-2.5 bg-pr-dark-gray border-gray-600 text-white"
                                >
                                    <option value="cliente">Cliente</option>
                                    <option value="empleado">Empleado</option>
                                    <option value="jefe">Jefe</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className={`w-full font-bold rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50 ${isEditing ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-pr-dark bg-pr-yellow hover:bg-yellow-400'}`}
                                >
                                    {loading ? 'Procesando...' : (isEditing ? 'Guardar Cambios' : 'Registrar Usuario')}
                                </button>

                                {isEditing && (
                                    <button 
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="w-1/3 bg-gray-600 text-white hover:bg-gray-500 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* TABLA DE USUARIOS */}
                    <div className="p-4 rounded-lg bg-pr-dark">
                        <h2 className="text-xl font-bold text-white mb-4">Usuarios Registrados</h2>
                        <div className="relative overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-300">
                                <thead className="text-xs uppercase bg-gray-700 text-gray-300">
                                    <tr>
                                        <th scope="col" className="px-4 py-3">Usuario</th>
                                        <th scope="col" className="px-4 py-3">Rol</th>
                                        <th scope="col" className="px-4 py-3 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="font-bold text-white">{user.username}</div>
                                                <div className="text-xs text-gray-400">{user.email}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                    {/* Lógica visual para los roles */}
                                                    {(() => {
                                                        const role = user.role || user.perfil?.rol || 'CLIENTE';
                                                        const label = role;
                                                        const classes = role === 'JEFE' ? 'bg-red-900 text-red-300' : role === 'EMPLEADO' ? 'bg-blue-900 text-blue-300' : 'bg-green-900 text-green-300';
                                                        return (
                                                            <span className={`px-2 py-1 rounded text-xs font-bold ${classes}`}>
                                                                {label}
                                                            </span>
                                                        );
                                                    })()}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-3">
                                                    <button 
                                                        onClick={() => handleEditClick(user)}
                                                        className="text-blue-400 hover:text-blue-300 text-xs font-medium underline"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button 
                                                        onClick={() => openConfirmDelete(user)}
                                                        className="text-red-400 hover:text-red-300 text-xs underline"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && (
                                        <tr><td colSpan="3" className="text-center py-4">No hay usuarios.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            
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
        </>
    );
};

export default JefeSettings;
