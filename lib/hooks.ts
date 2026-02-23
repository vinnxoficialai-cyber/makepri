import { useState, useEffect } from 'react';
import {
    ProductService,
    CustomerService,
    UserService,
    TransactionService,
    SettingsService,
    DeliveryService,
    SalesGoalService,
    TaskService
} from './database';
import type {
    Product,
    Customer,
    User,
    Transaction,
    CompanySettings,
    DeliveryOrder,
    SalesGoal
} from '../types';

// =====================================================
// HOOK: useProducts
// =====================================================

export function useProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await ProductService.getAll();
            setProducts(data);
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar produtos');
            console.error('Erro ao carregar produtos:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            const newProduct = await ProductService.create(product);
            setProducts(prev => [newProduct, ...prev]);
            return newProduct;
        } catch (err: any) {
            setError(err.message || 'Erro ao criar produto');
            throw err;
        }
    };

    const updateProduct = async (id: string, product: Partial<Product>) => {
        try {
            const updated = await ProductService.update(id, product);
            setProducts(prev => prev.map(p => p.id === id ? updated : p));
            return updated;
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar produto');
            throw err;
        }
    };

    const deleteProduct = async (id: string) => {
        try {
            await ProductService.delete(id);
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (err: any) {
            setError(err.message || 'Erro ao deletar produto');
            throw err;
        }
    };

    const updateStock = async (id: string, quantity: number) => {
        try {
            const updated = await ProductService.updateStock(id, quantity);
            setProducts(prev => prev.map(p => p.id === id ? updated : p));
            return updated;
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar estoque');
            throw err;
        }
    };

    return {
        products,
        loading,
        error,
        refresh: loadProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        updateStock
    };
}

// =====================================================
// HOOK: useCustomers
// =====================================================

export function useCustomers() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await CustomerService.getAll();
            setCustomers(data);
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar clientes');
            console.error('Erro ao carregar clientes:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCustomers();
    }, []);

    const addCustomer = async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            const newCustomer = await CustomerService.create(customer);
            setCustomers(prev => [newCustomer, ...prev]);
            return newCustomer;
        } catch (err: any) {
            setError(err.message || 'Erro ao criar cliente');
            throw err;
        }
    };

    const updateCustomer = async (id: string, customer: Partial<Customer>) => {
        try {
            const updated = await CustomerService.update(id, customer);
            setCustomers(prev => prev.map(c => c.id === id ? updated : c));
            return updated;
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar cliente');
            throw err;
        }
    };

    const deleteCustomer = async (id: string) => {
        try {
            await CustomerService.delete(id);
            setCustomers(prev => prev.filter(c => c.id !== id));
        } catch (err: any) {
            setError(err.message || 'Erro ao deletar cliente');
            throw err;
        }
    };

    const findByPhone = async (phone: string) => {
        try {
            return await CustomerService.getByPhone(phone);
        } catch (err: any) {
            setError(err.message || 'Erro ao buscar cliente');
            throw err;
        }
    };

    return {
        customers,
        loading,
        error,
        refresh: loadCustomers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        findByPhone
    };
}

// =====================================================
// HOOK: useUsers
// =====================================================

export function useUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await UserService.getAll();
            setUsers(data);
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar usuários');
            console.error('Erro ao carregar usuários:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const addUser = async (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            const newUser = await UserService.create(user);
            setUsers(prev => [newUser, ...prev]);
            return newUser;
        } catch (err: any) {
            setError(err.message || 'Erro ao criar usuário');
            throw err;
        }
    };

    const updateUser = async (id: string, user: Partial<User>) => {
        try {
            const updated = await UserService.update(id, user);
            setUsers(prev => prev.map(u => u.id === id ? updated : u));
            return updated;
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar usuário');
            throw err;
        }
    };

    const deleteUser = async (id: string) => {
        try {
            await UserService.delete(id);
            setUsers(prev => prev.filter(u => u.id !== id));
        } catch (err: any) {
            setError(err.message || 'Erro ao deletar usuário');
            throw err;
        }
    };

    return {
        users,
        loading,
        error,
        refresh: loadUsers,
        addUser,
        updateUser,
        deleteUser
    };
}

// =====================================================
// HOOK: useTransactions
// =====================================================

export function useTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadTransactions = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await TransactionService.getAll();
            setTransactions(data);
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar transações');
            console.error('Erro ao carregar transações:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTransactions();
    }, []);

    const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            const newTransaction = await TransactionService.create(transaction);
            setTransactions(prev => [newTransaction, ...prev]);
            return newTransaction;
        } catch (err: any) {
            setError(err.message || 'Erro ao criar transação');
            throw err;
        }
    };

    const getTodayTransactions = async () => {
        try {
            return await TransactionService.getToday();
        } catch (err: any) {
            setError(err.message || 'Erro ao buscar transações do dia');
            throw err;
        }
    };

    const getByDateRange = async (startDate: string, endDate: string) => {
        try {
            return await TransactionService.getByDateRange(startDate, endDate);
        } catch (err: any) {
            setError(err.message || 'Erro ao buscar transações');
            throw err;
        }
    };

    return {
        transactions,
        loading,
        error,
        refresh: loadTransactions,
        addTransaction,
        getTodayTransactions,
        getByDateRange
    };
}

// =====================================================
// HOOK: useSettings
// =====================================================

export function useSettings() {
    const [settings, setSettings] = useState<CompanySettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSettings = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await SettingsService.get();
            setSettings(data);
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar configurações');
            console.error('Erro ao carregar configurações:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const updateSettings = async (newSettings: Partial<CompanySettings>) => {
        try {
            const updated = await SettingsService.update(newSettings);
            setSettings(updated);
            return updated;
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar configurações');
            throw err;
        }
    };

    return {
        settings,
        loading,
        error,
        refresh: loadSettings,
        updateSettings
    };
}

// =====================================================
// HOOK: useDeliveries
// =====================================================

export function useDeliveries() {
    const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadDeliveries = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await DeliveryService.getAll();
            setDeliveries(data);
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar entregas');
            console.error('Erro ao carregar entregas:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDeliveries();
    }, []);

    return {
        deliveries,
        loading,
        error,
        refresh: loadDeliveries
    };
}

// =====================================================
// HOOK: useSalesGoals
// =====================================================

export function useSalesGoals() {
    const [salesGoals, setSalesGoals] = useState<SalesGoal>({
        storeGoal: 0,
        userGoals: {},
        goalTypes: {}
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadGoals = async () => {
        try {
            setLoading(true);
            setError(null);

            // Define period (Current Month)
            const date = new Date();
            const periodStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
            const periodEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

            const storeGoalPromise = SalesGoalService.getStoreGoal(periodStart, periodEnd);
            const userGoalsPromise = SalesGoalService.getUserGoals(periodStart, periodEnd);

            const [storeGoal, { userGoals, goalTypes }] = await Promise.all([storeGoalPromise, userGoalsPromise]);

            setSalesGoals({
                storeGoal,
                userGoals,
                goalTypes
            });
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar metas');
            console.error('Erro ao carregar metas:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGoals();
    }, []);

    const saveUserGoal = async (userId: string, amount: number, type: 'daily' | 'monthly') => {
        try {
            const date = new Date();
            const periodStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
            const periodEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

            await SalesGoalService.saveUserGoal(userId, amount, type, periodStart, periodEnd);

            // Update local state
            setSalesGoals(prev => ({
                ...prev,
                userGoals: { ...prev.userGoals, [userId]: amount },
                goalTypes: { ...prev.goalTypes, [userId]: type }
            }));
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar meta do usuário');
            throw err;
        }
    };

    return {
        salesGoals,
        loading,
        error,
        refresh: loadGoals,
        saveUserGoal
    };
}

// =====================================================
// HOOK: useTasks
// =====================================================

export function useTasks() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadTasks = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await TaskService.getAll();
            setTasks(data);
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar tarefas');
            console.error('Erro ao carregar tarefas:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, []);

    const addTask = async (task: { title: string, description: string, assignedTo: string, createdBy: string, dueDate: string, priority: string }) => {
        try {
            const newTask = await TaskService.create(task);
            setTasks(prev => [newTask, ...prev]);
            return newTask;
        } catch (err: any) {
            console.error('Erro ao criar tarefa:', err);
            throw err;
        }
    };

    const toggleStatus = async (id: string) => {
        try {
            const task = tasks.find(t => t.id === id);
            if (!task) return;
            const newStatus = task.status === 'pending' ? 'completed' : 'pending';
            await TaskService.updateStatus(id, newStatus);
            setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
        } catch (err: any) {
            console.error('Erro ao atualizar tarefa:', err);
        }
    };

    const deleteTask = async (id: string) => {
        try {
            await TaskService.delete(id);
            setTasks(prev => prev.filter(t => t.id !== id));
        } catch (err: any) {
            console.error('Erro ao excluir tarefa:', err);
        }
    };

    return {
        tasks,
        loading,
        error,
        refresh: loadTasks,
        addTask,
        toggleStatus,
        deleteTask
    };
}
