
import React, { useState, useEffect } from 'react';
import { User, UserRole, ModuleType, CompanySettings, SalesGoal, Product, Customer } from '../types';
import { Users, Shield, Plus, X, Save, Trash2, Check, UserCircle, Image, Building, Upload, Edit, Camera, Lock, Target, MapPin, Phone, Globe, FileText, Calendar, Clock, RotateCcw, Package, Search, Zap, AlertTriangle, ChevronDown } from 'lucide-react';
import { useToast } from '../components/Toast';
import { useSettings } from '../lib/hooks';
import { useImageUpload } from '../lib/images';
import { UserService, ProductService, CustomerService } from '../lib/database';
import { SmoothTabs } from '../components/ds/SmoothTabs';
import { Badge, DSButton, StatusBadge, DSIconButton } from '../components/ds/index';
import { SectionHeader, Notice } from '../components/ds/layout';

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
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'users' | 'company' | 'inactive'>('users');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Inactive items state
  const [inactiveProducts, setInactiveProducts] = useState<Product[]>([]);
  const [inactiveCustomers, setInactiveCustomers] = useState<Customer[]>([]);
  const [inactiveLoading, setInactiveLoading] = useState(false);
  const [inactiveSearch, setInactiveSearch] = useState('');
  // Bulk selection
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
  // Admin password for permanent delete
  const [isDeletePasswordModalOpen, setIsDeletePasswordModalOpen] = useState(false);
  const [deletePasswordInput, setDeletePasswordInput] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');
  const [pendingDeleteAction, setPendingDeleteAction] = useState<(() => Promise<void>) | null>(null);
  // Inactivation rules
  const [rulesExpanded, setRulesExpanded] = useState(false);
  const [ruleStaleProductsDays, setRuleStaleProductsDays] = useState('60');
  const [ruleZeroStockDays, setRuleZeroStockDays] = useState('30');
  const [ruleStaleCustomersDays, setRuleStaleCustomersDays] = useState('90');
  const [ruleSuggestions, setRuleSuggestions] = useState<{ type: string; items: any[]; label: string }[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

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

  // Load inactive items when tab is selected
  useEffect(() => {
    if (activeTab === 'inactive') {
      loadInactiveItems();
    }
  }, [activeTab]);

  const loadInactiveItems = async () => {
    setInactiveLoading(true);
    try {
      const [products, customers] = await Promise.all([
        ProductService.getInactive(),
        CustomerService.getInactive()
      ]);
      setInactiveProducts(products);
      setInactiveCustomers(customers);
    } catch (error) {
      console.error('Erro ao carregar inativos:', error);
    } finally {
      setInactiveLoading(false);
    }
  };

  const handleReactivateProduct = async (id: string) => {
    try {
      await ProductService.reactivate(id);
      setInactiveProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Produto reativado!');
    } catch (error: any) {
      toast.error('Erro ao reativar:' + error.message);
    }
  };

  const handleReactivateCustomer = async (id: string) => {
    try {
      await CustomerService.reactivate(id);
      setInactiveCustomers(prev => prev.filter(c => c.id !== id));
      toast.success('Cliente reativado!');
    } catch (error: any) {
      toast.error('Erro ao reativar:' + error.message);
    }
  };

  // Toggle product selection
  const toggleProductSelection = (id: string) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleCustomerSelection = (id: string) => {
    setSelectedCustomerIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAllProducts = () => {
    const filtered = inactiveProducts.filter(p => p.name?.toLowerCase().includes(inactiveSearch.toLowerCase()));
    if (selectedProductIds.size === filtered.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filtered.map(p => p.id)));
    }
  };
  const toggleAllCustomers = () => {
    const filtered = inactiveCustomers.filter(c => c.name?.toLowerCase().includes(inactiveSearch.toLowerCase()));
    if (selectedCustomerIds.size === filtered.length) {
      setSelectedCustomerIds(new Set());
    } else {
      setSelectedCustomerIds(new Set(filtered.map(c => c.id)));
    }
  };

  // Bulk reactivate
  const handleBulkReactivateProducts = async () => {
    if (selectedProductIds.size === 0) return;
    if (!window.confirm(`Reativar ${selectedProductIds.size} produto(s)?`)) return;
    setIsBulkProcessing(true);
    try {
      await ProductService.bulkReactivate(Array.from(selectedProductIds));
      setInactiveProducts(prev => prev.filter(p => !selectedProductIds.has(p.id)));
      setSelectedProductIds(new Set());
      toast.info(` ${selectedProductIds.size} produto(s) reativado(s)!`);
    } catch (error: any) {
      toast.error('Erro:' + error.message);
    } finally {
      setIsBulkProcessing(false);
    }
  };
  const handleBulkReactivateCustomers = async () => {
    if (selectedCustomerIds.size === 0) return;
    if (!window.confirm(`Reativar ${selectedCustomerIds.size} cliente(s)?`)) return;
    setIsBulkProcessing(true);
    try {
      await CustomerService.bulkReactivate(Array.from(selectedCustomerIds));
      setInactiveCustomers(prev => prev.filter(c => !selectedCustomerIds.has(c.id)));
      setSelectedCustomerIds(new Set());
      toast.info(` ${selectedCustomerIds.size} cliente(s) reativado(s)!`);
    } catch (error: any) {
      toast.error('Erro:' + error.message);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Permanent delete with admin password
  const requestPermanentDelete = (type: 'products' | 'customers') => {
    const ids = type === 'products' ? selectedProductIds : selectedCustomerIds;
    if (ids.size === 0) { toast.info('Selecione ao menos um item.'); return; }
    const action = async () => {
      setIsBulkProcessing(true);
      try {
        if (type === 'products') {
          await ProductService.bulkDeletePermanently(Array.from(selectedProductIds));
          setInactiveProducts(prev => prev.filter(p => !selectedProductIds.has(p.id)));
          setSelectedProductIds(new Set());
        } else {
          await CustomerService.bulkDeletePermanently(Array.from(selectedCustomerIds));
          setInactiveCustomers(prev => prev.filter(c => !selectedCustomerIds.has(c.id)));
          setSelectedCustomerIds(new Set());
        }
        toast.info(` ${ids.size} item(ns) excluido(s) permanentemente!`);
      } catch (error: any) {
        toast.error('Erro:' + error.message);
      } finally {
        setIsBulkProcessing(false);
      }
    };
    setPendingDeleteAction(() => action);
    setDeletePasswordInput('');
    setDeletePasswordError('');
    setIsDeletePasswordModalOpen(true);
  };
  const handleDeletePasswordSubmit = async () => {
    const FIXED_PASSWORD = 'Primake2026';
    if (deletePasswordInput.trim() !== FIXED_PASSWORD) {
      setDeletePasswordError('Senha incorreta.');
      return;
    }
    setIsDeletePasswordModalOpen(false);
    if (pendingDeleteAction) await pendingDeleteAction();
    setPendingDeleteAction(null);
  };

  // Analyze rules
  const handleAnalyzeRules = async () => {
    setRulesLoading(true);
    setRuleSuggestions([]);
    try {
      const results: { type: string; items: any[]; label: string }[] = [];
      const staleDays = parseInt(ruleStaleProductsDays) || 60;
      const zeroDays = parseInt(ruleZeroStockDays) || 30;
      const customerDays = parseInt(ruleStaleCustomersDays) || 90;

      const [stale, zeroStock, zeroPrice, staleCust] = await Promise.all([
        ProductService.getStaleProducts(staleDays),
        ProductService.getZeroStockSince(zeroDays),
        ProductService.getZeroPriceProducts(),
        CustomerService.getStaleCustomers(customerDays)
      ]);

      if (stale.length > 0) results.push({ type: 'stale_products', items: stale, label: `${stale.length} produto(s) sem vendas ha ${staleDays} dias` });
      if (zeroStock.length > 0) results.push({ type: 'zero_stock', items: zeroStock, label: `${zeroStock.length} produto(s) com estoque zerado ha ${zeroDays} dias` });
      if (zeroPrice.length > 0) results.push({ type: 'zero_price', items: zeroPrice, label: `${zeroPrice.length} produto(s) com preco R$0,00` });
      if (staleCust.length > 0) results.push({ type: 'stale_customers', items: staleCust, label: `${staleCust.length} cliente(s) sem compra ha ${customerDays} dias` });

      setRuleSuggestions(results);
      if (results.length === 0) toast.info('Nenhum item encontrado para inativacao automatica.');
    } catch (error: any) {
      toast.error('Erro ao analisar:' + error.message);
    } finally {
      setRulesLoading(false);
    }
  };
  const handleApplyRuleSuggestion = async (suggestion: { type: string; items: any[] }) => {
    const count = suggestion.items.length;
    if (!window.confirm(`Inativar ${count} item(ns)? Eles poderao ser reativados depois.`)) return;
    setIsBulkProcessing(true);
    try {
      const ids = suggestion.items.map((i: any) => i.id);
      if (suggestion.type === 'stale_customers') {
        await CustomerService.bulkInactivate(ids);
      } else {
        await ProductService.bulkInactivate(ids);
      }
      setRuleSuggestions(prev => prev.filter(s => s.type !== suggestion.type));
      await loadInactiveItems();
      toast.info(` ${count} item(ns) inativado(s)!`);
    } catch (error: any) {
      toast.error('Erro:' + error.message);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleSaveCompany = async () => {
    if (!isAdmin) {
      toast.info("Apenas administradores podem alterar dados da empresa.");
      return;
    }

    try {
      // Salvar no Supabase
      await updateSettings(localCompanySettings);

      // Atualizar estado local também
      setCompanySettings(localCompanySettings);

      toast.success('Dados da empresa salvos com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar dados:' + error.message);
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

        toast.success('Logo atualizado com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload:' + error.message);
    }
  };

  const handleUserAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Fazer upload para Supabase Storage
      const imageUrl = await uploadImage(file, 'avatars');

      if (imageUrl) {
        // Atualizar formulário local
        setUserForm(prev => ({
          ...prev,
          avatarUrl: imageUrl
        }));

        // Salvar imediatamente no banco de dados
        if (editingUserId) {
          try {
            const updatedUser = await UserService.update(editingUserId, { avatarUrl: imageUrl });
            // Atualizar estado local dos usuários
            setUsers(users.map(u => u.id === editingUserId ? { ...u, avatarUrl: imageUrl } : u));
            // Se for o usuário logado, atualizar currentUser também
            if (editingUserId === currentUser.id) {
              setCurrentUser({ ...currentUser, avatarUrl: imageUrl });
            }
          } catch (dbErr: any) {
            console.error('Erro ao salvar avatar no banco:', dbErr);
          }
        }

        toast.success('Avatar atualizado!');
      }
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload:' + error.message);
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
      toast.success('Usuário salvo com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      toast.error('Erro ao salvar usuário:' + error.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!isAdmin) return;
    if (confirm('Tem certeza que deseja remover este usuário?')) {
      try {
        await UserService.delete(userId);
        setUsers(users.filter(u => u.id !== userId));
        toast.success('Usuário removido com sucesso!');
      } catch (error: any) {
        console.error('Erro ao deletar usuário:', error);
        toast.error('Erro ao deletar usuário:' + error.message);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Configurações</h2>
        <p className="text-slate-500 dark:text-slate-400">Gerencie usuários, permissões e dados da empresa.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="p-4">
          <SmoothTabs
            tabs={[
              { key: 'users', label: 'Usuarios e Permissoes', icon: <Users size={16} /> },
              { key: 'company', label: 'Dados da Empresa', icon: <Building size={16} /> },
              { key: 'inactive', label: 'Inativos', icon: <RotateCcw size={16} /> },
            ]}
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as 'users' | 'company' | 'inactive')}
          />
        </div>

        <div className="p-6">
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <SectionHeader title="Usuários do Sistema" />
                {isAdmin && (
                  <DSButton
                    onClick={openNewUserModal}
                    variant="primary"
                    startIcon={<Plus size={16} />}
                  >Novo Usuário
                  </DSButton>
                )}
              </div>

              {/* Simulator Tip */}
              <Notice variant="info" title="Simulador de Acesso" description="Use os botoes Entrar abaixo para testar o sistema como se fosse aquele usuario. O Dashboard e o Menu lateral mudarao de acordo com as permissoes." />

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase">
                    <tr>
                      <th className="p-4 font-semibold">Usuário</th>
                      <th className="p-4 font-semibold">Função</th>
                      <th className="p-4 font-semibold">Meta (Tipo)</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border border-slate-100 dark:border-slate-600 flex-shrink-0">
                              {user.avatarUrl ? <img loading="lazy" decoding="async" src={user.avatarUrl} className="w-full h-full object-cover" /> : <UserCircle size={32} className="text-slate-400 m-auto mt-1" />}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary" size="sm">
                            {user.role}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {salesGoals.userGoals[user.id] ? `R$ ${salesGoals.userGoals[user.id].toLocaleString('pt-BR')}` : '-'}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase">
                              {salesGoals.goalTypes[user.id] === 'daily' ? 'Diária' : 'Mensal'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <StatusBadge label="Ativo" variant="success" showDot size="sm" />
                        </td>
                        <td className="p-4 text-right flex items-center justify-end gap-2">
                          {user.id !== currentUser.id ? (
                            <DSButton
                              onClick={() =>setCurrentUser(user)}
                              className="text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-primary/30 hover:text-primary dark:hover:text-primary dark:text-slate-300 px-2 py-1 rounded transition-colors"
                              title="Simular Login"
                            >
                              Entrar
                            </DSButton>
                          ) : (
                            <span className="text-xs bg-primary-50 dark:bg-primary/900/30 text-primary dark:text-primary px-2 py-1 rounded border border-primary/20 dark:border-primary/900/50">Atual</span>
                          )}

                          {isAdmin && (
                            <>
                              <DSIconButton onClick={() => openEditUserModal(user)} variant="ghost" size="sm" title="Editar">
                                <Edit size={16} />
                              </DSIconButton>
                              <DSIconButton onClick={() => handleDeleteUser(user.id)} variant="destructive" size="sm" title="Excluir">
                                <Trash2 size={16} />
                              </DSIconButton>
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
              <div className="bg-slate-50 dark:bg-slate-700/30 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                  <Image size={20} className="text-primary" /> Identidade Visual
                </h3>

                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Preview Area */}
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Pré-visualização (Menu)</p>
                      <div className="w-48 h-32 bg-primary/30 rounded-lg flex items-center justify-center overflow-hidden border border-primary/30 shadow-sm relative">
                        {localCompanySettings.logoUrl ? (
                          <img loading="lazy" decoding="async"
                            src={localCompanySettings.logoUrl}
                            alt="Preview"
                            className="max-w-[160px] max-h-[100px] w-auto h-auto object-contain p-2"
                          />
                        ) : (
                          <div className="text-slate-400 flex flex-col items-center">
                            <Image size={24} />
                            <span className="text-xs mt-1">Sem Logo</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Upload Actions */}
                    <div className="flex-1 w-full">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Alterar Logo</label>
                      <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 flex flex-col items-center justify-center bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-center relative">
                        <Upload size={32} className="text-slate-300 dark:text-slate-500 mb-2" />
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                          Arraste e solte ou clique para enviar
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
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
              <div className="bg-slate-50 dark:bg-slate-700/30 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                  <Building size={20} className="text-indigo-500" /> Informações Cadastrais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Nome Fantasia / Razão Social</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      value={localCompanySettings.name}
                      onChange={e => setLocalCompanySettings({ ...localCompanySettings, name: e.target.value })}
                      disabled={!isAdmin}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">CNPJ</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      placeholder="00.000.000/0000-00"
                      value={localCompanySettings.cnpj || ''}
                      onChange={e => setLocalCompanySettings({ ...localCompanySettings, cnpj: e.target.value })}
                      disabled={!isAdmin}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Telefone / WhatsApp</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
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
              <div className="bg-slate-50 dark:bg-slate-700/30 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                  <MapPin size={20} className="text-emerald-500" /> Endereço e Contato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Endereço Completo</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      placeholder="Rua, Número, Bairro"
                      value={localCompanySettings.address || ''}
                      onChange={e => setLocalCompanySettings({ ...localCompanySettings, address: e.target.value })}
                      disabled={!isAdmin}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Cidade / UF</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      placeholder="São Paulo - SP"
                      value={localCompanySettings.city || ''}
                      onChange={e => setLocalCompanySettings({ ...localCompanySettings, city: e.target.value })}
                      disabled={!isAdmin}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Site / Instagram</label>
                    <div className="relative">
                      <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
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
              <div className="bg-slate-50 dark:bg-slate-700/30 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                  <FileText size={20} className="text-amber-500" /> Configurações de Impressão
                </h3>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Mensagem de Rodapé (Cupom)</label>
                  <textarea
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-200 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white h-24 resize-none"
                    placeholder="Ex: Obrigado pela preferência! Trocas somente com etiqueta."
                    value={localCompanySettings.receiptMessage || ''}
                    onChange={e => setLocalCompanySettings({ ...localCompanySettings, receiptMessage: e.target.value })}
                    disabled={!isAdmin}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 pb-8">
                <DSButton
                  onClick={handleSaveCompany}
                  className={`px-6 py-3 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2 ${isAdmin ? 'bg-primary hover:bg-primary-700 text-white hover:shadow-lg hover:-translate-y-0.5' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                  disabled={!isAdmin}
                ><Save size={18} /> Salvar Todos os Dados
                </DSButton>
              </div>
            </div>
          )}

          {/* INACTIVE ITEMS TAB */}
          {activeTab === 'inactive' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <RotateCcw size={20} className="text-amber-500" /> Itens Inativos
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie produtos e clientes inativos. Reative, exclua ou aplique regras automaticas.</p>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar por nome..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[rgb(var(--primary) / 0.3)]/50 focus:border-primary/30 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                    value={inactiveSearch}
                    onChange={e => setInactiveSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* RULES SECTION */}
              {isAdmin && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50 overflow-hidden">
                  <DSButton
                    onClick={() =>setRulesExpanded(!rulesExpanded)}
                    className="w-full p-4 flex items-center gap-3 text-left hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors"
                  >
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
                      <Zap size={18} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm">Regras de Inativacao Automatica</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Analise e inative itens que atendem criterios especificos</p>
                    </div>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${rulesExpanded ? 'rotate-180' : ''}`} />
                  </DSButton>
                  {rulesExpanded && (
                    <div className="p-4 pt-0 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Produtos sem vendas ha</label>
                          <div className="flex items-center gap-2 mt-1">
                            <input type="number" min="7" max="365" className="w-20 px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-300" value={ruleStaleProductsDays} onChange={e => setRuleStaleProductsDays(e.target.value)} />
                            <span className="text-xs text-slate-500 dark:text-slate-400">dias</span>
                          </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estoque zerado ha</label>
                          <div className="flex items-center gap-2 mt-1">
                            <input type="number" min="7" max="365" className="w-20 px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-300" value={ruleZeroStockDays} onChange={e => setRuleZeroStockDays(e.target.value)} />
                            <span className="text-xs text-slate-500 dark:text-slate-400">dias</span>
                          </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Clientes sem compra ha</label>
                          <div className="flex items-center gap-2 mt-1">
                            <input type="number" min="7" max="365" className="w-20 px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-300" value={ruleStaleCustomersDays} onChange={e => setRuleStaleCustomersDays(e.target.value)} />
                            <span className="text-xs text-slate-500 dark:text-slate-400">dias</span>
                          </div>
                        </div>
                      </div>
                      <DSButton
                        onClick={handleAnalyzeRules}
                        disabled={rulesLoading}
                        className="px-4 py-2 bg-primary hover:bg-primary-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                      >{rulesLoading ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" /> : <Zap size={14} />}
                        {rulesLoading ? 'Analisando...' : 'Analisar Agora'}
                      </DSButton>
                      {/* Rule Results */}
                      {ruleSuggestions.length > 0 && (
                        <div className="space-y-2">
                          {ruleSuggestions.map(s => (
                            <div key={s.type} className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-3">
                              <div className="flex items-center gap-2">
                                <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
                                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{s.label}</span>
                              </div>
                              <DSButton
                                onClick={() =>handleApplyRuleSuggestion(s)}
                                disabled={isBulkProcessing}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                              >
                                Inativar
                              </DSButton>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {inactiveLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary/30"></div>
                </div>
              ) : (
                <>
                  {/* Inactive Products */}
                  <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                      <Package size={16} className="text-amber-500" />
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm">Produtos Inativos</h4>
                      <span className="ml-auto bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full text-xs font-bold">
                        {inactiveProducts.filter(p => p.name?.toLowerCase().includes(inactiveSearch.toLowerCase())).length}
                      </span>
                    </div>
                    {/* Bulk Action Bar - Products */}
                    {selectedProductIds.size > 0 && (
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-900/30 flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{selectedProductIds.size} selecionado(s)</span>
                        <DSButton onClick={handleBulkReactivateProducts} disabled={isBulkProcessing} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1"><RotateCcw size={12} /> Reativar
                        </DSButton>
                        <DSButton onClick={() =>requestPermanentDelete('products')} disabled={isBulkProcessing} className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1">
                          <Trash2 size={12} /> Excluir Permanente
                        </DSButton>
                        <DSButton onClick={() =>setSelectedProductIds(new Set())} className="px-2 py-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs transition-colors">Limpar</DSButton>
                      </div>
                    )}
                    {inactiveProducts.filter(p => p.name?.toLowerCase().includes(inactiveSearch.toLowerCase())).length > 0 ? (
                      <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {/* Select All */}
                        <div className="px-4 py-2 bg-slate-100/50 dark:bg-slate-700/20 flex items-center gap-3">
                          <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-primary/20 cursor-pointer" checked={selectedProductIds.size === inactiveProducts.filter(p => p.name?.toLowerCase().includes(inactiveSearch.toLowerCase())).length && selectedProductIds.size > 0} onChange={toggleAllProducts} />
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Selecionar todos</span>
                        </div>
                        {inactiveProducts
                          .filter(p => p.name?.toLowerCase().includes(inactiveSearch.toLowerCase()))
                          .map(product => (
                            <div key={product.id} className={`flex items-center justify-between p-4 hover:bg-white dark:hover:bg-slate-700/50 transition-colors ${selectedProductIds.has(product.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                              <div className="flex items-center gap-3">
                                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-primary/20 cursor-pointer" checked={selectedProductIds.has(product.id)} onChange={() => toggleProductSelection(product.id)} />
                                {product.imageUrl ? (
                                  <img loading="lazy" decoding="async" src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-600" />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                                    <Package size={16} className="text-slate-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-slate-800 dark:text-white text-sm">{product.name}</p>
                                  <p className="text-xs text-slate-400">SKU: {product.sku} • R$ {product.priceSale?.toFixed(2)}</p>
                                </div>
                              </div>
                              <DSButton
                                onClick={() =>handleReactivateProduct(product.id)}
                                className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors flex items-center gap-1.5"
                              >
                                <RotateCcw size={12} /> Reativar
                              </DSButton>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                        <Package size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Nenhum produto inativo encontrado.</p>
                      </div>
                    )}
                  </div>

                  {/* Inactive Customers */}
                  <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                      <Users size={16} className="text-amber-500" />
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm">Clientes Inativos</h4>
                      <span className="ml-auto bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full text-xs font-bold">
                        {inactiveCustomers.filter(c => c.name?.toLowerCase().includes(inactiveSearch.toLowerCase())).length}
                      </span>
                    </div>
                    {/* Bulk Action Bar - Customers */}
                    {selectedCustomerIds.size > 0 && (
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-900/30 flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{selectedCustomerIds.size} selecionado(s)</span>
                        <DSButton onClick={handleBulkReactivateCustomers} disabled={isBulkProcessing} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1"><RotateCcw size={12} /> Reativar
                        </DSButton>
                        <DSButton onClick={() =>requestPermanentDelete('customers')} disabled={isBulkProcessing} className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1">
                          <Trash2 size={12} /> Excluir Permanente
                        </DSButton>
                        <DSButton onClick={() =>setSelectedCustomerIds(new Set())} className="px-2 py-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs transition-colors">Limpar</DSButton>
                      </div>
                    )}
                    {inactiveCustomers.filter(c => c.name?.toLowerCase().includes(inactiveSearch.toLowerCase())).length > 0 ? (
                      <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {/* Select All */}
                        <div className="px-4 py-2 bg-slate-100/50 dark:bg-slate-700/20 flex items-center gap-3">
                          <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-primary/20 cursor-pointer" checked={selectedCustomerIds.size === inactiveCustomers.filter(c => c.name?.toLowerCase().includes(inactiveSearch.toLowerCase())).length && selectedCustomerIds.size > 0} onChange={toggleAllCustomers} />
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Selecionar todos</span>
                        </div>
                        {inactiveCustomers
                          .filter(c => c.name?.toLowerCase().includes(inactiveSearch.toLowerCase()))
                          .map(customer => (
                            <div key={customer.id} className={`flex items-center justify-between p-4 hover:bg-white dark:hover:bg-slate-700/50 transition-colors ${selectedCustomerIds.has(customer.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                              <div className="flex items-center gap-3">
                                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-primary/20 cursor-pointer" checked={selectedCustomerIds.has(customer.id)} onChange={() => toggleCustomerSelection(customer.id)} />
                                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm border border-indigo-100 dark:border-indigo-800">
                                  {customer.name ? customer.name.substring(0, 2).toUpperCase() : '??'}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-800 dark:text-white text-sm">{customer.name}</p>
                                  <p className="text-xs text-slate-400">{customer.email || customer.phone || 'Sem contato'}</p>
                                </div>
                              </div>
                              <DSButton
                                onClick={() =>handleReactivateCustomer(customer.id)}
                                className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors flex items-center gap-1.5"
                              >
                                <RotateCcw size={12} /> Reativar
                              </DSButton>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                        <Users size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Nenhum cliente inativo encontrado.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsUserModalOpen(false)}></div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg relative flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* ... Modal content ... */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700/30">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">{editingUserId ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <DSButton onClick={() =>setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full p-1 transition-colors">
                <X size={20} />
              </DSButton>
            </div>

            <form onSubmit={handleSaveUser} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Avatar */}
              <div className="flex flex-col items-center mb-4">
                <div className="relative group cursor-pointer">
                  <div className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm bg-slate-200 dark:bg-slate-600">
                    {userForm.avatarUrl ? (
                      <img loading="lazy" decoding="async" src={userForm.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle size={88} className="text-slate-400 m-auto mt-1" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" size={24} />
                  </div>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/png, image/jpeg, image/jpg" onChange={handleUserAvatarUpload} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Clique para alterar a foto</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nome Completo</label>
                  <input required type="text" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[rgb(var(--primary) / 0.3)]/50 focus:border-primary/30 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="Ex: João da Silva" value={userForm.name || ''} onChange={e => setUserForm({ ...userForm, name: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">E-mail</label>
                  <input required type="email" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[rgb(var(--primary) / 0.3)]/50 focus:border-primary/30 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="email@empresa.com" value={userForm.email || ''} onChange={e => setUserForm({ ...userForm, email: e.target.value })} />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Login (Usuário)</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[rgb(var(--primary) / 0.3)]/50 focus:border-primary/30 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="usuario.login" value={userForm.login || ''} onChange={e => setUserForm({ ...userForm, login: e.target.value })} />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                    {editingUserId ? <Lock size={12} /> : null} Senha
                  </label>
                  <input type="password" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[rgb(var(--primary) / 0.3)]/50 focus:border-primary/30 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder={editingUserId ? "Deixe vazio para manter" : "••••••••"} value={userForm.password || ''} onChange={e => setUserForm({ ...userForm, password: e.target.value })} />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Função / Cargo</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {roles.map(role => (
                      <div key={role.id} onClick={() => handleRoleChange(role.id)} className={`cursor-pointer border rounded-lg p-2 text-center text-xs font-medium transition-all ${userForm.role === role.id ? 'border-primary/30 bg-primary/30/20 text-slate-900 dark:text-white ring-1 ring-[rgb(var(--primary) / 0.3)]' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-600 dark:text-slate-400'}`}>
                        {role.id}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                    <Target size={12} /> Definição de Metas (Sincronizadas)
                  </label>

                  <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600">
                    {/* Meta Diária */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Meta Diária
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                        <input
                          type="number"
                          className="w-full pl-8 pr-2 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-1 focus:ring-primary/20 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm"
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
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Meta Mensal
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                        <input
                          type="number"
                          className="w-full pl-8 pr-2 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-1 focus:ring-primary/20 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm"
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
                    <div className={`w-2 h-2 rounded-full ${userForm.goalType === 'daily' ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                    <p className="text-[10px] text-slate-400">
                      Visualização preferida: <strong className="text-slate-600 dark:text-slate-300">{userForm.goalType === 'daily' ? 'Diária' : 'Mensal'}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Permissões de Acesso</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allModules.map(module => (
                    <label key={module.id} className={`flex items-center p-2 rounded-lg border cursor-pointer transition-all ${userForm.permissions?.includes(module.id) ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'}`}>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 ${userForm.permissions?.includes(module.id) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-500'}`}>
                        {userForm.permissions?.includes(module.id) && <Check size={10} strokeWidth={4} />}
                      </div>
                      <input type="checkbox" className="hidden" checked={userForm.permissions?.includes(module.id)} onChange={() => togglePermission(module.id)} />
                      <span className={`text-sm ${userForm.permissions?.includes(module.id) ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-slate-600 dark:text-slate-400'}`}>
                        {module.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </form>

            <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 flex justify-end gap-3">
              <DSButton onClick={() =>setIsUserModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors">Cancelar</DSButton>
              <DSButton onClick={handleSaveUser} variant="primary"><Save size={16} /> {editingUserId ? 'Atualizar Usuário' : 'Salvar Usuário'}</DSButton>
            </div>
          </div>
        </div>
      )}
      {/* Admin Password Modal for Permanent Delete */}
      {isDeletePasswordModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={() => { setIsDeletePasswordModalOpen(false); setPendingDeleteAction(null); }} />
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm relative animate-in fade-in zoom-in-95 duration-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                <AlertTriangle size={20} className="text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Exclusao Permanente</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Essa acao nao pode ser desfeita.</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Senha do Administrador</label>
                <input
                  type="password"
                  className={`w-full mt-1 px-3 py-2.5 border-2 rounded-xl focus:outline-none text-sm font-medium bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white transition-colors ${deletePasswordError ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 dark:border-slate-600 focus:border-rose-500'}`}
                  placeholder="Digite a senha..."
                  value={deletePasswordInput}
                  onChange={e => { setDeletePasswordInput(e.target.value); setDeletePasswordError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleDeletePasswordSubmit()}
                  autoFocus
                />
                {deletePasswordError && (
                  <p className="text-xs text-rose-500 font-bold mt-1 flex items-center gap-1"><AlertTriangle size={10} /> {deletePasswordError}</p>
                )}
              </div>
              <div className="flex gap-2">
                <DSButton onClick={() =>{ setIsDeletePasswordModalOpen(false); setPendingDeleteAction(null); }} className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                  Cancelar
                </DSButton>
                <DSButton onClick={handleDeletePasswordSubmit} className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold transition-colors">Confirmar Exclusao
                </DSButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
