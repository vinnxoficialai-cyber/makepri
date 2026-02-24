import { supabase } from './supabase';
import { toCamelCase, toSnakeCase } from './database';
import type { CashRegister, CashMovement } from '../types';

// =====================================================
// SERVIÇO DE CAIXA
// =====================================================

export const CashService = {
    // Buscar caixa aberto
    async getCurrentRegister(): Promise<CashRegister | null> {
        const { data, error } = await supabase
            .from('cash_registers')
            .select('*')
            .eq('status', 'open')
            .order('opened_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Não encontrado
            throw error;
        }
        return toCamelCase(data) as CashRegister;
    },

    // Buscar último caixa fechado para saldo inicial
    async getLastClosedRegister(): Promise<CashRegister | null> {
        const { data, error } = await supabase
            .from('cash_registers')
            .select('*')
            .eq('status', 'closed')
            .order('closed_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            return null; // Silent fail
        }
        return toCamelCase(data) as CashRegister;
    },

    // Abrir caixa
    async openRegister(openingBalance: number, openedBy: string): Promise<CashRegister> {
        const { data, error } = await supabase
            .from('cash_registers')
            .insert({
                opening_balance: openingBalance,
                opened_by: openedBy,
                status: 'open'
            })
            .select()
            .single();

        if (error) throw error;
        return toCamelCase(data) as CashRegister;
    },

    // Fechar caixa
    async closeRegister(
        id: string,
        closingBalance: number,
        expectedBalance: number,
        closedBy: string,
        notes?: string
    ): Promise<CashRegister> {
        const difference = closingBalance - expectedBalance;

        const { data, error } = await supabase
            .from('cash_registers')
            .update({
                closed_at: new Date().toISOString(),
                closing_balance: closingBalance,
                expected_balance: expectedBalance,
                difference: difference,
                closed_by: closedBy,
                status: 'closed',
                notes: notes
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return toCamelCase(data) as CashRegister;
    },

    // Buscar movimentações do caixa
    async getMovements(cashRegisterId: string): Promise<CashMovement[]> {
        const { data, error } = await supabase
            .from('cash_movements')
            .select('*')
            .eq('cash_register_id', cashRegisterId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return toCamelCase(data) as CashMovement[];
    },

    // Adicionar movimentação
    async addMovement(movement: Omit<CashMovement, 'id' | 'createdAt'>): Promise<CashMovement> {
        const movementData = toSnakeCase(movement);

        const { data, error } = await supabase
            .from('cash_movements')
            .insert(movementData)
            .select()
            .single();

        if (error) throw error;
        return toCamelCase(data) as CashMovement;
    },

    // Buscar histórico de caixas
    async getHistory(limit: number = 30): Promise<CashRegister[]> {
        const { data, error } = await supabase
            .from('cash_registers')
            .select('*')
            .order('opened_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return toCamelCase(data) as CashRegister[];
    },

    // Buscar TODAS as movimentações (histórico cross-dia)
    async getAllMovements(): Promise<CashMovement[]> {
        const { data, error } = await supabase
            .from('cash_movements')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return toCamelCase(data) as CashMovement[];
    },

    // Buscar movimentações por data (cobre fuso BRT = UTC-3, janela alargada ±1 dia)
    async getMovementsForDate(date: string): Promise<CashMovement[]> {
        // Expand window by 1 extra day on each side to cover any BR timezone offset,
        // then filter to the exact local date after fetching.
        const startDate = new Date(`${date}T00:00:00.000Z`);
        startDate.setUTCDate(startDate.getUTCDate() - 1); // one day before
        const endDate = new Date(`${date}T23:59:59.999Z`);
        endDate.setUTCDate(endDate.getUTCDate() + 1);   // one day after

        const { data, error } = await supabase
            .from('cash_movements')
            .select('*')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
            .order('created_at', { ascending: false });

        if (error) throw error;
        const all = toCamelCase(data) as CashMovement[];
        // Filter to only records matching the local date string
        return all.filter(m => {
            const local = new Date((m as any).createdAt).toLocaleDateString('en-CA'); // 'YYYY-MM-DD'
            return local === date;
        });
    },

    // Buscar caixa por ID
    async getById(id: string): Promise<CashRegister | null> {
        const { data, error } = await supabase
            .from('cash_registers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return toCamelCase(data) as CashRegister;
    }
};
