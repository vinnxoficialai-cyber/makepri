import { supabase } from './supabase';
import type {
    Product,
    Customer,
    User,
    Transaction,
    DeliveryOrder,
    Task,
    FinancialRecord,
    CompanySettings
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

// =====================================================
// DELIVERY SERVICE
// =====================================================

export const DeliveryService = {
    /**
     * Listar todas as entregas
     */
    async getAll(): Promise<DeliveryOrder[]> {
        const { data, error } = await supabase
            .from('deliveries')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(delivery => ({
            id: delivery.order_id,
            customerName: delivery.customer_name,
            phone: delivery.phone || '',
            address: delivery.address,
            city: delivery.city || '',
            source: delivery.source as any,
            method: delivery.method as any,
            status: delivery.status as any,
            itemsSummary: delivery.items_summary || '',
            totalValue: Number(delivery.total_value) || 0,
            fee: Number(delivery.fee) || 0,
            motoboyName: delivery.motoboy_name,
            trackingCode: delivery.tracking_code,
            notes: delivery.notes,
            date: delivery.created_at
        }));
    },

    /**
     * Buscar entregas por status
     */
    async getByStatus(status: string): Promise<DeliveryOrder[]> {
        const { data, error } = await supabase
            .from('deliveries')
            .select('*')
            .eq('status', status)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(delivery => ({
            id: delivery.order_id,
            customerName: delivery.customer_name,
            phone: delivery.phone || '',
            address: delivery.address,
            city: delivery.city || '',
            source: delivery.source as any,
            method: delivery.method as any,
            status: delivery.status as any,
            itemsSummary: delivery.items_summary || '',
            totalValue: Number(delivery.total_value) || 0,
            fee: Number(delivery.fee) || 0,
            motoboyName: delivery.motoboy_name,
            trackingCode: delivery.tracking_code,
            notes: delivery.notes,
            date: delivery.created_at
        }));
    },

    /**
     * Buscar entregas de um motoboy específico
     */
    async getByMotoboy(motoboyName: string): Promise<DeliveryOrder[]> {
        const { data, error } = await supabase
            .from('deliveries')
            .select('*')
            .eq('motoboy_name', motoboyName)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(delivery => ({
            id: delivery.order_id,
            customerName: delivery.customer_name,
            phone: delivery.phone || '',
            address: delivery.address,
            city: delivery.city || '',
            source: delivery.source as any,
            method: delivery.method as any,
            status: delivery.status as any,
            itemsSummary: delivery.items_summary || '',
            totalValue: Number(delivery.total_value) || 0,
            fee: Number(delivery.fee) || 0,
            motoboyName: delivery.motoboy_name,
            trackingCode: delivery.tracking_code,
            notes: delivery.notes,
            date: delivery.created_at
        }));
    },

    /**
     * Criar nova entrega
     */
    async create(delivery: Partial<DeliveryOrder>): Promise<DeliveryOrder> {
        const deliveryData = {
            order_id: delivery.id || `DEL-${Date.now().toString().slice(-6)}`,
            customer_name: delivery.customerName || '',
            phone: delivery.phone,
            address: delivery.address || '',
            city: delivery.city,
            source: delivery.source,
            method: delivery.method,
            status: delivery.status || 'Pendente',
            items_summary: delivery.itemsSummary,
            total_value: delivery.totalValue,
            fee: delivery.fee,
            motoboy_name: delivery.motoboyName,
            tracking_code: delivery.trackingCode,
            notes: delivery.notes
        };

        const { data, error } = await supabase
            .from('deliveries')
            .insert([deliveryData])
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.order_id,
            customerName: data.customer_name,
            phone: data.phone || '',
            address: data.address,
            city: data.city || '',
            source: data.source as any,
            method: data.method as any,
            status: data.status as any,
            itemsSummary: data.items_summary || '',
            totalValue: Number(data.total_value) || 0,
            fee: Number(data.fee) || 0,
            motoboyName: data.motoboy_name,
            trackingCode: data.tracking_code,
            notes: data.notes,
            date: data.created_at
        };
    },

    /**
     * Atualizar entrega
     */
    async update(orderId: string, updates: Partial<DeliveryOrder>): Promise<DeliveryOrder> {
        const updateData: any = {};

        if (updates.status !== undefined) updateData.status = updates.status;
        if (updates.notes !== undefined) updateData.notes = updates.notes;
        if (updates.motoboyName !== undefined) updateData.motoboy_name = updates.motoboyName;
        if (updates.trackingCode !== undefined) updateData.tracking_code = updates.trackingCode;

        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('deliveries')
            .update(updateData)
            .eq('order_id', orderId)
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.order_id,
            customerName: data.customer_name,
            phone: data.phone || '',
            address: data.address,
            city: data.city || '',
            source: data.source as any,
            method: data.method as any,
            status: data.status as any,
            itemsSummary: data.items_summary || '',
            totalValue: Number(data.total_value) || 0,
            fee: Number(data.fee) || 0,
            motoboyName: data.motoboy_name,
            trackingCode: data.tracking_code,
            notes: data.notes,
            date: data.created_at
        };
    },

    /**
     * Deletar entrega
     */
    async delete(orderId: string): Promise<void> {
        const { error } = await supabase
            .from('deliveries')
            .delete()
            .eq('order_id', orderId);

        if (error) throw error;
    },

    /**
     * Obter relatório de repasses (entregas concluídas por motoboy)
     */
    async getPayoutReport(): Promise<Record<string, { count: number, totalFee: number }>> {
        const { data, error } = await supabase
            .from('deliveries')
            .select('motoboy_name, fee')
            .eq('status', 'Entregue')
            .eq('method', 'Motoboy');

        if (error) throw error;

        const payoutByMotoboy: Record<string, { count: number, totalFee: number }> = {};

        (data || []).forEach(delivery => {
            const boyName = delivery.motoboy_name || 'Não Atribuído';
            if (!payoutByMotoboy[boyName]) {
                payoutByMotoboy[boyName] = { count: 0, totalFee: 0 };
            }
            payoutByMotoboy[boyName].count += 1;
            payoutByMotoboy[boyName].totalFee += Number(delivery.fee) || 0;
        });

        return payoutByMotoboy;
    }
};
