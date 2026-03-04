import { supabase } from './supabase';
import type {
    Product,
    Customer,
    User,
    Transaction,
    DeliveryOrder,
    Task,
    FinancialRecord,
    CompanySettings,
    CashRegister,
    CashMovement
} from '../types';

// =====================================================
// HELPERS DE CONVERSÃO (TypeScript ↔ SQL)
// =====================================================

// Converte snake_case para camelCase
export function toCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(item => toCamelCase(item));
    }

    if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
            const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            acc[camelKey] = toCamelCase(obj[key]);
            return acc;
        }, {} as any);
    }

    return obj;
}

// Converte camelCase para snake_case
export function toSnakeCase(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(item => toSnakeCase(item));
    }

    if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            acc[snakeKey] = toSnakeCase(obj[key]);
            return acc;
        }, {} as any);
    }

    return obj;
}

// ... (resto do código permanece igual até o final)
