
import React, { useState, useEffect } from 'react';
import { User, UserRole, ModuleType, CompanySettings, SalesGoal } from '../types';
import { Users, Shield, Plus, X, Save, Trash2, Check, UserCircle, Image, Building, Upload, Edit, Camera, Lock, Target, MapPin, Phone, Globe, FileText, Calendar, Clock } from 'lucide-react';
import { useSettings } from '../lib/hooks';
import { useImageUpload } from '../lib/images';
import { UserService } from '../lib/database';

interface SettingsProps {
    users: User[];
    setUsers: (users: User[]) => void;
    currentUser: User;
    setCurrentUser: (user: User) => void;
    companySettings: CompanySettings;
    setCompanySettings: (settings: CompanySettings) => void;
    salesGoals: SalesGoal;
    onUpdateGoal: (userId: string, amount: number, type: 'daily' | 'monthly') => void;
}

const Settings: React.FC<SettingsProps> = ({
    users, setUsers, currentUser, setCurrentUser, companySettings, setCompanySettings, salesGoals, onUpdateGoal
}) => {
    const [activeTab, setActiveTab] = useState<'users' | 'company'>('users');
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);

    // Default form state for new user
    const [userForm, setUserForm] = useState<Partial<User> & { login?: string; password?: string; customGoal?: string; goalType?: 'daily' | 'monthly' }>({
        role: 'Vendedor',
        permissions: ['dashboard', 'pos', 'crm'],
        active: true,
        login: '',
        password: '',
        avatarUrl: '',
        customGoal: '0',
        goalType: 'monthly'
    });

    // Supabase hooks
    const { settings: supabaseSettings, updateSettings, loading: settingsLoading } = useSettings();
    const { uploadImage, uploading: imageUploading, error: imageError } = useImageUpload();

    // Local state for company form to allow cancelling
    const [localCompanySettings, setLocalCompanySettings] = useState<CompanySettings>(companySettings);

    // Carregar configurações do Supabase quando disponíveis
    useEffect(() => {
        if (supabaseSettings) {
            setLocalCompanySettings(supabaseSettings);
            setCompanySettings(supabaseSettings);
        }
    }, [supabaseSettings]);

    const isAdmin = currentUser.role === 'Administrador';

    const handleSaveCompany = async () => {
        if (!isAdmin) {
            alert("Apenas administradores podem alterar dados da empresa.");
            return;
        }

        try {
            // Salvar no Supabase
            await updateSettings(localCompanySettings);

            // Atualizar estado local também
            setCompanySettings(localCompanySettings);

            alert('✅ Dados da empresa salvos com sucesso!');
        } catch (error: any) {
            console.error('Erro ao salvar:', error);
            alert('❌ Erro ao salvar dados: ' + error.message);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // Fazer upload para Supabase Storage
            const imageUrl = await uploadImage(file, 'logos');

            if (imageUrl) {
                // Atualizar estado local
                const newSettings = {
                    ...localCompanySettings,
                    logoUrl: imageUrl
                };
                setLocalCompanySettings(newSettings);

                // Salvar no banco de dados
                await updateSettings({ logoUrl: imageUrl });
                setCompanySettings(newSettings);

                alert('✅ Logo atualizado com sucesso!');
            }
        } catch (error: any) {
            console.error('Erro ao fazer upload:', error);
            alert('❌ Erro ao fazer upload: ' + error.message);
        }
    };

    const handleUserAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // Fazer upload para Supabase Storage
            const imageUrl = await uploadImage(file, 'avatars');

            if (imageUrl) {
                setUserForm(prev => ({
                    ...prev,
                    avatarUrl: imageUrl
                }));
                alert('✅ Avatar atualizado!');
            }
        } catch (error: any) {
            console.error('Erro ao fazer upload:', error);
            alert('❌ Erro ao fazer upload: ' + error.message);
        }
    };

    // UPDATED MODULE LIST
    const allModules: { id: ModuleType, label: string }[] = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'team', label: 'Equipe & Metas' },
        { id: 'bundles', label: 'Kits e Combos' },
        { id: 'inventory', label: 'Estoque' },
        { id: 'pos', label: 'PDV / Vendas' },
        { id: 'crm', label: 'Clientes (CRM)' },
        { id: 'finance', label: 'Financeiro' },
        { id: 'cash', label: 'Controle de Caixa' },
        { id: 'reports', label: 'Relatórios' },
        { id: 'settings', label: 'Configurações' },
        { id: 'ecommerce', label: 'E-commerce' },
        { id: 'ai', label: 'Primake AI' },
        { id: 'delivery', label: 'Entregas' },
    ];

    const roles: { id: UserRole, defaultPermissions: ModuleType[] }[] = [
        { id: 'Administrador', defaultPermissions: ['dashboard', 'inventory', 'pos', 'crm', 'finance', 'cash', 'reports', 'settings', 'ecommerce', 'bundles', 'ai', 'delivery', 'team'] },
        { id: 'Gerente', defaultPermissions: ['dashboard', 'inventory', 'pos', 'crm', 'finance', 'cash', 'reports', 'bundles', 'team'] },
        { id: 'Vendedor', defaultPermissions: ['dashboard', 'pos', 'crm', 'bundles', 'team', 'delivery'] },
        { id: 'Estoquista', defaultPermissions: ['inventory', 'bundles', 'team'] },
        { id: 'Caixa', defaultPermissions: ['pos', 'cash'] },
        { id: 'Motoboy', defaultPermissions: ['delivery'] }, // Only Delivery access
    ];

    const handleRoleChange = (role: UserRole) => {
        const roleData = roles.find(r => r.id === role);
        setUserForm({
            ...userForm,
            role: role,
            permissions: roleData ? [...roleData.defaultPermissions] : []
        });
    };

    const togglePermission = (moduleId: ModuleType) => {
        const currentPermissions = userForm.permissions || [];
        if (currentPermissions.includes(moduleId)) {
            setUserForm({
                ...userForm,
                permissions: currentPermissions.filter(p => p !== moduleId)
            });
        } else {
            setUserForm({
                ...userForm,
                permissions: [...currentPermissions, moduleId]
            });
        }
    };

    const openNewUserModal = () => {
        setEditingUserId(null);
        setUserForm({
            role: 'Vendedor',
            permissions: ['dashboard', 'pos', 'crm'],
            active: true,
            login: '',
            password: '',
            avatarUrl: '',
            customGoal: '0',
            goalType: 'monthly',
            defaultGoal: 0,
            defaultGoalType: 'monthly'
        });
        setIsUserModalOpen(true);
    };

    const openEditUserModal = (user: User) => {
        setEditingUserId(user.id);
        setUserForm({
            ...user,
            password: '',
            // Prioritize persistent goal (defaultGoal), fallback to SalesGoals table
            customGoal: (user.defaultGoal || salesGoals.userGoals[user.id] || 0).toString(),
            goalType: user.defaultGoalType || salesGoals.goalTypes[user.id] || 'monthly'
        });
        setIsUserModalOpen(true);
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            let targetUserId = editingUserId;
            const goalValue = parseFloat(userForm.customGoal || '0');
            const goalType = userForm.goalType || 'monthly';

            // Check if ID is a valid UUID (Supabase requirement)
            const isValidUUID = editingUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editingUserId);

            if (editingUserId && isValidUUID) {
                // Update existing user in Supabase (valid UUID)
                const userData = {
                    name: userForm.name,
                    email: userForm.email,
                    role: userForm.role as UserRole,
                    permissions: userForm.permissions || [],
                    active: userForm.active !== undefined ? userForm.active : true,
                    avatarUrl: userForm.avatarUrl,
                    defaultGoal: goalValue, // Save persistently
                    defaultGoalType: goalType
                };

                const updatedUser = await UserService.update(editingUserId, userData);

                // Update local state
                setUsers(users.map(u => u.id === editingUserId ? updatedUser : u));

                // If we are modifying the currently logged in user, update their session state
                if (editingUserId === currentUser.id) {
                    setCurrentUser(updatedUser);
                }
            } else {
                // Create new user in Supabase (either new user OR legacy ID that needs migration)
                const userToAdd = {
                    name: userForm.name || 'Novo Usuário',
                    email: userForm.email || 'user@email.com',
                    role: userForm.role as UserRole,
                    permissions: userForm.permissions || [],
                    active: userForm.active !== undefined ? userForm.active : true,
                    avatarUrl: userForm.avatarUrl || '',
                    defaultGoal: goalValue, // Save persistently
                    defaultGoalType: goalType
                };

                const createdUser = await UserService.create(userToAdd);
                targetUserId = createdUser.id;

                // If migrating a legacy user, remove the old one from local state
                if (editingUserId) {
                    setUsers(users.map(u => u.id === editingUserId ? createdUser : u));

                    // If migrating the currently logged in user, update their session
                    if (editingUserId === currentUser.id) {
                        setCurrentUser(createdUser);
                    }
                } else {
                    // New user - add to list
                    setUsers([...users, createdUser]);
                }
            }

            // Update Sales Goal for this user
            if (targetUserId) {
                // Save to database/hook via callback
                onUpdateGoal(targetUserId, goalValue, goalType);
            }

            setIsUserModalOpen(false);
            alert('✅ Usuário salvo com sucesso!');
        } catch (error: any) {
            console.error('Erro ao salvar usuário:', error);
            alert('❌ Erro ao salvar usuário: ' + error.message);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!isAdmin) return;
        if (confirm('Tem certeza que deseja remover este usuário?')) {
            try {
                await UserService.delete(userId);
                setUsers(users.filter(u => u.id !== userId));
                alert('✅ Usuário removido com sucesso!');
            } catch (error: any) {
                console.error('Erro ao deletar usuário:', error);
                alert('❌ Erro ao deletar usuário: ' + error.message);
            }
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Configurações</h2>
                <p className="text-gray-500 dark:text-gray-400">Gerencie usuários, permissões e dados da empresa.</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
                {/* Tabs */}
                <div className="flex border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'users' ? 'border-[#ffc8cb] text-gray-900 dark:text-white' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <Users size={16} /> Usuários e Permissões
                    </button>
                    <button
                        onClick={() => setActiveTab('company')}
                        className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'company' ? 'border-[#ffc8cb] text-gray-900 dark:text-white' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <Building size={16} /> Dados da Empresa
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === 'users' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Usuários do Sistema</h3>
                                {isAdmin && (
                                    <button
                                        onClick={openNewUserModal}
                                        className="bg-[#ffc8cb] hover:bg-[#ffb6b9] text-gray-900 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                                    >
                                        <Plus size={16} /> Novo Usuário
                                    </button>
                                )}
                            </div>

                            {/* Simulator Tip */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 p-4 rounded-lg flex items-start gap-3">
                                <div className="p-1 bg-blue-100 dark:bg-blue-900/40 rounded text-blue-600 dark:text-blue-400 mt-0.5">
                                    <Shield size={16} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300">Simulador de Acesso</h4>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                        Use os botões "Entrar" abaixo para testar o sistema como se fosse aquele usuário.
                                        O Dashboard e o Menu lateral mudarão de acordo com as permissões.
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase">
                                        <tr>
                                            <th className="p-4 font-semibold">Usuário</th>
                                            <th className="p-4 font-semibold">Função</th>
                                            <th className="p-4 font-semibold">Meta (Tipo)</th>
                                            <th className="p-4 font-semibold">Status</th>
                                            <th className="p-4 font-semibold text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                        {users.map(user => (
                                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border border-gray-100 dark:border-gray-600 flex-shrink-0">
                                                            {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <UserCircle size={32} className="text-gray-400 m-auto mt-1" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-700 dark:text-gray-300">
                                                            {salesGoals.userGoals[user.id] ? `R$ ${salesGoals.userGoals[user.id].toLocaleString('pt-BR')}` : '-'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 uppercase">
                                                            {salesGoals.goalTypes[user.id] === 'daily' ? 'Diária' : 'Mensal'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Ativo
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right flex items-center justify-end gap-2">
                                                    {user.id !== currentUser.id ? (
                                                        <button
                                                            onClick={() => setCurrentUser(user)}
                                                            className="text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-[#ffc8cb] hover:text-pink-600 dark:hover:text-pink-400 dark:text-gray-300 px-2 py-1 rounded transition-colors"
                                                            title="Simular Login"
                                                        >
                                                            Entrar
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-2 py-1 rounded border border-pink-100 dark:border-pink-900/50">Atual</span>
                                                    )}

                                                    {isAdmin && (
                                                        <>
                                                            <button onClick={() => openEditUserModal(user)} className="p-1.5 text-gray-400 hover:text-indigo-500 transition-colors" title="Editar">
                                                                <Edit size={16} />
                                                            </button>
                                                            <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="Excluir">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Company Settings Tab Content... (Same as before) */}
                    {activeTab === 'company' && (
                        <div className="max-w-4xl mx-auto space-y-8">
                            {/* ... Visual Identity, Registration Info, Address, etc. ... */}
                            <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                                <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                                    <Image size={20} className="text-pink-500" /> Identidade Visual
                                </h3>

                                <div className="space-y-6">
                                    <div className="flex flex-col md:flex-row gap-6 items-start">
                                        {/* Preview Area */}
                                        <div>
                                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Pré-visualização (Menu)</p>
                                            <div className="w-48 h-32 bg-[#ffc8cb] rounded-lg flex items-center justify-center overflow-hidden border border-pink-200 shadow-sm relative">
                                                {localCompanySettings.logoUrl ? (
                                                    <img
                                                        src={localCompanySettings.logoUrl}
                                                        alt="Preview"
                                                        className="max-w-[160px] max-h-[100px] w-auto h-auto object-contain p-2"
                                                    />
                                                ) : (
                                                    <div className="text-gray-400 flex flex-col items-center">
                                                        <Image size={24} />
                                                        <span className="text-xs mt-1">Sem Logo</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Upload Actions */}
                                        <div className="flex-1 w-full">
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Alterar Logo</label>
                                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 flex flex-col items-center justify-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-center relative">
                                                <Upload size={32} className="text-gray-300 dark:text-gray-500 mb-2" />
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                    Arraste e solte ou clique para enviar
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                                                    Formatos: JPEG, PNG
                                                </p>
                                                <input
                                                    type="file"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    accept="image/png, image/jpeg, image/jpg"
                                                    onChange={handleLogoUpload}
                                                    disabled={!isAdmin}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Registration Info */}
                            <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                                <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                                    <Building size={20} className="text-indigo-500" /> Informações Cadastrais
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Nome Fantasia / Razão Social</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            value={localCompanySettings.name}
                                            onChange={e => setLocalCompanySettings({ ...localCompanySettings, name: e.target.value })}
                                            disabled={!isAdmin}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">CNPJ</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            placeholder="00.000.000/0000-00"
                                            value={localCompanySettings.cnpj || ''}
                                            onChange={e => setLocalCompanySettings({ ...localCompanySettings, cnpj: e.target.value })}
                                            disabled={!isAdmin}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Telefone / WhatsApp</label>
                                        <div className="relative">
                                            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                                placeholder="(00) 00000-0000"
                                                value={localCompanySettings.phone || ''}
                                                onChange={e => setLocalCompanySettings({ ...localCompanySettings, phone: e.target.value })}
                                                disabled={!isAdmin}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Address & Contact */}
                            <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                                <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                                    <MapPin size={20} className="text-emerald-500" /> Endereço e Contato
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Endereço Completo</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            placeholder="Rua, Número, Bairro"
                                            value={localCompanySettings.address || ''}
                                            onChange={e => setLocalCompanySettings({ ...localCompanySettings, address: e.target.value })}
                                            disabled={!isAdmin}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Cidade / UF</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            placeholder="São Paulo - SP"
                                            value={localCompanySettings.city || ''}
                                            onChange={e => setLocalCompanySettings({ ...localCompanySettings, city: e.target.value })}
                                            disabled={!isAdmin}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Site / Instagram</label>
                                        <div className="relative">
                                            <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                                placeholder="@sualoja"
                                                value={localCompanySettings.website || ''}
                                                onChange={e => setLocalCompanySettings({ ...localCompanySettings, website: e.target.value })}
                                                disabled={!isAdmin}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Receipt Settings */}
                            <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                                <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                                    <FileText size={20} className="text-amber-500" /> Configurações de Impressão
                                </h3>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Mensagem de Rodapé (Cupom)</label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-200 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white h-24 resize-none"
                                        placeholder="Ex: Obrigado pela preferência! Trocas somente com etiqueta."
                                        value={localCompanySettings.receiptMessage || ''}
                                        onChange={e => setLocalCompanySettings({ ...localCompanySettings, receiptMessage: e.target.value })}
                                        disabled={!isAdmin}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 pb-8">
                                <button
                                    onClick={handleSaveCompany}
                                    className={`px-6 py-3 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2 ${isAdmin ? 'bg-[#ffc8cb] hover:bg-[#ffb6b9] text-gray-900 hover:shadow-lg hover:-translate-y-0.5' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                    disabled={!isAdmin}
                                >
                                    <Save size={18} /> Salvar Todos os Dados
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit User Modal */}
            {isUserModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsUserModalOpen(false)}></div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg relative flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* ... Modal content ... */}
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white">{editingUserId ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                            <button onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-1 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveUser} className="flex-1 overflow-y-auto p-6 space-y-5">
                            {/* Avatar */}
                            <div className="flex flex-col items-center mb-4">
                                <div className="relative group cursor-pointer">
                                    <div className="w-24 h-24 rounded-full border-4 border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm bg-gray-200 dark:bg-gray-600">
                                        {userForm.avatarUrl ? (
                                            <img src={userForm.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <UserCircle size={88} className="text-gray-400 m-auto mt-1" />
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="text-white" size={24} />
                                    </div>
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/png, image/jpeg, image/jpg" onChange={handleUserAvatarUpload} />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Clique para alterar a foto</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nome Completo</label>
                                    <input required type="text" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc8cb]/50 focus:border-[#ffc8cb] outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Ex: João da Silva" value={userForm.name || ''} onChange={e => setUserForm({ ...userForm, name: e.target.value })} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">E-mail</label>
                                    <input required type="email" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc8cb]/50 focus:border-[#ffc8cb] outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="email@empresa.com" value={userForm.email || ''} onChange={e => setUserForm({ ...userForm, email: e.target.value })} />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Login (Usuário)</label>
                                    <input type="text" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc8cb]/50 focus:border-[#ffc8cb] outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="usuario.login" value={userForm.login || ''} onChange={e => setUserForm({ ...userForm, login: e.target.value })} />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                                        {editingUserId ? <Lock size={12} /> : null} Senha
                                    </label>
                                    <input type="password" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffc8cb]/50 focus:border-[#ffc8cb] outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder={editingUserId ? "Deixe vazio para manter" : "••••••••"} value={userForm.password || ''} onChange={e => setUserForm({ ...userForm, password: e.target.value })} />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Função / Cargo</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {roles.map(role => (
                                            <div key={role.id} onClick={() => handleRoleChange(role.id)} className={`cursor-pointer border rounded-lg p-2 text-center text-xs font-medium transition-all ${userForm.role === role.id ? 'border-[#ffc8cb] bg-[#ffc8cb]/20 text-gray-900 dark:text-white ring-1 ring-[#ffc8cb]' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400'}`}>
                                                {role.id}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                                        <Target size={12} /> Definição de Metas (Sincronizadas)
                                    </label>

                                    <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                                        {/* Meta Diária */}
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                                                Meta Diária
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">R$</span>
                                                <input
                                                    type="number"
                                                    className="w-full pl-8 pr-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-sm"
                                                    placeholder="0.00"
                                                    step="0.01"
                                                    value={userForm.goalType === 'daily' ? userForm.customGoal : (parseFloat(userForm.customGoal || '0') / 30).toFixed(2)}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value || '0');
                                                        setUserForm({
                                                            ...userForm,
                                                            customGoal: (val * 30).toFixed(2), // Always store Monthly in customGoal/defaultGoal
                                                            goalType: 'daily'
                                                        });
                                                    }}
                                                    onClick={() => setUserForm({ ...userForm, goalType: 'daily' })}
                                                />
                                            </div>
                                        </div>

                                        {/* Meta Mensal */}
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                                                Meta Mensal
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">R$</span>
                                                <input
                                                    type="number"
                                                    className="w-full pl-8 pr-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-sm"
                                                    placeholder="0.00"
                                                    step="0.01"
                                                    value={userForm.goalType === 'monthly' ? userForm.customGoal : (parseFloat(userForm.customGoal || '0')).toString()}
                                                    onChange={(e) => {
                                                        setUserForm({
                                                            ...userForm,
                                                            customGoal: e.target.value,
                                                            goalType: 'monthly'
                                                        });
                                                    }}
                                                    onClick={() => setUserForm({ ...userForm, goalType: 'monthly' })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-2">
                                        <div className={`w-2 h-2 rounded-full ${userForm.goalType === 'daily' ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                        <p className="text-[10px] text-gray-400">
                                            Visualização preferida: <strong className="text-gray-600 dark:text-gray-300">{userForm.goalType === 'daily' ? 'Diária' : 'Mensal'}</strong>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Permissões de Acesso</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {allModules.map(module => (
                                        <label key={module.id} className={`flex items-center p-2 rounded-lg border cursor-pointer transition-all ${userForm.permissions?.includes(module.id) ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 ${userForm.permissions?.includes(module.id) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 dark:border-gray-500'}`}>
                                                {userForm.permissions?.includes(module.id) && <Check size={10} strokeWidth={4} />}
                                            </div>
                                            <input type="checkbox" className="hidden" checked={userForm.permissions?.includes(module.id)} onChange={() => togglePermission(module.id)} />
                                            <span className={`text-sm ${userForm.permissions?.includes(module.id) ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                                {module.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </form>

                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex justify-end gap-3">
                            <button onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors">Cancelar</button>
                            <button onClick={handleSaveUser} className="px-6 py-2 bg-[#ffc8cb] hover:bg-[#ffb6b9] text-gray-900 rounded-lg text-sm font-medium shadow-md shadow-pink-200 transition-all flex items-center gap-2"><Save size={16} /> {editingUserId ? 'Atualizar Usuário' : 'Salvar Usuário'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
