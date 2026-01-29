
import { Product, ProductCategory, Customer, Transaction, FinancialRecord, User, Task, DeliveryOrder } from './types';

// --- MOCK PRODUCTS (ZERADO) ---
export const MOCK_PRODUCTS: Product[] = [];

// --- MOCK CUSTOMERS (ZERADO) ---
export const MOCK_CUSTOMERS: Customer[] = [];

// --- MOCK TRANSACTIONS (ZERADO) ---
export const MOCK_TRANSACTIONS: Transaction[] = [];

// --- MOCK FINANCIALS (ZERADO) ---
export const MOCK_FINANCIALS: FinancialRecord[] = [];

// --- USERS (APENAS 1 ADMIN PADRÃO PARA ACESSO INICIAL) ---
export const MOCK_USERS: User[] = [
    {
        id: 'admin-01',
        name: 'Administrador',
        email: 'admin@primake.com',
        role: 'Administrador',
        permissions: ['dashboard', 'inventory', 'pos', 'crm', 'finance', 'reports', 'cash', 'settings', 'ecommerce', 'bundles', 'ai', 'delivery', 'team'],
        active: true,
        avatarUrl: '' // Sem avatar
    }
];

// --- MOCK TASKS (ZERADO) ---
export const MOCK_TASKS: Task[] = [];

// --- MOCK DELIVERIES (ZERADO) ---
export const MOCK_DELIVERIES: DeliveryOrder[] = [];
