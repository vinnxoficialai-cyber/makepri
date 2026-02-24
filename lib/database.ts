import { supabase } from './supabase';
export { CashService } from './cash-service';
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
// SERVIÇO DE PRODUTOS
// =====================================================

export const ProductService = {
    // Buscar todos os produtos
    async getAll(): Promise<Product[]> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return toCamelCase(data) as Product[];
    },

    // Buscar produto por ID
    async getById(id: string): Promise<Product | null> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return toCamelCase(data) as Product;
    },

    // Buscar produto por SKU
    async getBySku(sku: string): Promise<Product | null> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('sku', sku)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Não encontrado
            throw error;
        }
        return toCamelCase(data) as Product;
    },

    // Criar produto
    async create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
        const productData = toSnakeCase(product);

        const { data, error } = await supabase
            .from('products')
            .insert(productData)
            .select()
            .single();

        if (error) throw error;
        return toCamelCase(data) as Product;
    },

    // Atualizar produto
    async update(id: string, product: Partial<Product>): Promise<Product> {
        const productData = toSnakeCase(product);

        const { data, error } = await supabase
            .from('products')
            .update(productData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return toCamelCase(data) as Product;
    },

    // Inativar produto (soft delete)
    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('products')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;
    },

    // Buscar produtos inativos
    async getInactive(): Promise<Product[]> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_active', false)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return toCamelCase(data) as Product[];
    },

    // Reativar produto
    async reactivate(id: string): Promise<Product> {
        const { data, error } = await supabase
            .from('products')
            .update({ is_active: true })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return toCamelCase(data) as Product;
    },

    // Atualizar estoque
    async updateStock(id: string, quantity: number): Promise<Product> {
        const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', id)
            .single();

        const newStock = (product?.stock || 0) + quantity;

        return this.update(id, { stock: newStock });
    },

    // Buscar produtos com estoque baixo
    async getLowStock(): Promise<Product[]> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .filter('stock', 'lte', 'min_stock')
            .order('stock', { ascending: true });

        if (error) throw error;
        return toCamelCase(data) as Product[];
    },

    // --- VARIAÇÕES ---

    // Buscar variações de um produto
    async getVariations(productId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('product_variations')
            .select('*')
            .eq('product_id', productId);

        if (error) throw error;
        return toCamelCase(data);
    },

    // Adicionar variação
    async addVariation(variation: any): Promise<any> {
        const variationData = toSnakeCase(variation);
        const { data, error } = await supabase
            .from('product_variations')
            .insert(variationData)
            .select()
            .single();

        if (error) throw error;
        return toCamelCase(data);
    },

    // Deletar variação
    async deleteVariation(id: string): Promise<void> {
        const { error } = await supabase
            .from('product_variations')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// =====================================================
// SERVIÇO DE CLIENTES
// =====================================================

export const CustomerService = {
    // Buscar todos os clientes
    async getAll(): Promise<Customer[]> {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return toCamelCase(data) as Customer[];
    },

    // Buscar cliente por ID
    async getById(id: string): Promise<Customer | null> {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return toCamelCase(data) as Customer;
    },

    // Buscar por telefone
    async getByPhone(phone: string): Promise<Customer | null> {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('phone', phone)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return toCamelCase(data) as Customer;
    },

    // Criar cliente
    async create(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
        const customerData = toSnakeCase(customer);

        const { data, error } = await supabase
            .from('customers')
            .insert(customerData)
            .select()
            .single();

        if (error) throw error;
        return toCamelCase(data) as Customer;
    },

    // Atualizar cliente
    async update(id: string, customer: Partial<Customer>): Promise<Customer> {
        const customerData = toSnakeCase(customer);

        const { data, error } = await supabase
            .from('customers')
            .update(customerData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return toCamelCase(data) as Customer;
    },

    // Inativar cliente (soft delete)
    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('customers')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;
    },

    // Buscar clientes inativos
    async getInactive(): Promise<Customer[]> {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('is_active', false)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return toCamelCase(data) as Customer[];
    },

    // Reativar cliente
    async reactivate(id: string): Promise<Customer> {
        const { data, error } = await supabase
            .from('customers')
            .update({ is_active: true })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return toCamelCase(data) as Customer;
    },

    // Atualizar total gasto
    async updateTotalSpent(id: string, amount: number): Promise<Customer> {
        const { data: customer } = await supabase
            .from('customers')
            .select('total_spent')
            .eq('id', id)
            .single();

        const newTotal = (customer?.total_spent || 0) + amount;

        return this.update(id, {
            totalSpent: newTotal,
            lastPurchase: new Date().toISOString()
        });
    }
};

// =====================================================
// SERVIÇO DE USUÁRIOS
// =====================================================

export const UserService = {
    // Buscar todos os usuários
    async getAll(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return toCamelCase(data) as User[];
    },

    // Buscar usuário por ID
    async getById(id: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return toCamelCase(data) as User;
    },

    // Buscar por email
    async getByEmail(email: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return toCamelCase(data) as User;
    },

    // Criar usuário
    async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
        const userData = toSnakeCase(user);

        const { data, error } = await supabase
            .from('users')
            .insert(userData)
            .select()
            .single();

        if (error) throw error;
        return toCamelCase(data) as User;
    },

    // Atualizar usuário
    async update(id: string, user: Partial<User>): Promise<User> {
        const userData = toSnakeCase(user);

        const { data, error } = await supabase
            .from('users')
            .update(userData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return toCamelCase(data) as User;
    },

    // Deletar usuário
    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Buscar usuários ativos
    async getActive(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('active', true)
            .order('name');

        if (error) throw error;
        return toCamelCase(data) as User[];
    }
};

// =====================================================
// SERVIÇO DE TRANSAÇÕES
// =====================================================

export const TransactionService = {
    // Helper: map Supabase transaction_items back to CartItem-like shape
    _mapTransactionWithItems(raw: any): any {
        const mapped = { ...raw };
        // Supabase returns joined table as 'transaction_items' array
        if (raw.transaction_items && Array.isArray(raw.transaction_items)) {
            mapped.items = raw.transaction_items.map((ti: any) => ({
                id: ti.product_id,
                name: ti.product_name,
                sku: ti.product_sku || '---',
                category: ti.product_category || '',
                quantity: ti.quantity,
                priceSale: ti.unit_price,
                priceCost: 0,
                stock: 0,
                minStock: 0,
                unit: 'un',
                variationId: ti.variation_id,
                variationName: ti.variation_name
            }));
            delete mapped.transaction_items;
        }
        return mapped;
    },

    // Buscar todas as transações COM itens
    async getAll(): Promise<Transaction[]> {
        const { data, error } = await supabase
            .from('transactions')
            .select('*, transaction_items(*)')
            .order('date', { ascending: false });

        if (error) throw error;
        const withItems = (data || []).map((row: any) => this._mapTransactionWithItems(row));
        return toCamelCase(withItems) as Transaction[];
    },

    // Buscar transação por ID
    async getById(id: string): Promise<Transaction | null> {
        const { data, error } = await supabase
            .from('transactions')
            .select(`
        *,
        transaction_items (*)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        const withItems = this._mapTransactionWithItems(data);
        return toCamelCase(withItems) as Transaction;
    },

    // Criar transação com itens
    async create(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
        // Remove customerSnapshot (não existe no schema do Supabase)
        const { customerSnapshot, ...transactionWithoutSnapshot } = transaction as any;

        const transactionData = toSnakeCase(transactionWithoutSnapshot);
        const { items, ...transactionWithoutItems } = transactionData;

        // Criar transação
        const { data: newTransaction, error: transactionError } = await supabase
            .from('transactions')
            .insert(transactionWithoutItems)
            .select()
            .single();

        if (transactionError) throw transactionError;

        // Criar itens da transação
        if (items && items.length > 0) {
            const transactionItems = items.map((item: any) => ({
                transaction_id: newTransaction.id,
                product_id: item.id,
                variation_id: item.variationId,
                variation_name: item.variationName,
                product_name: item.name,
                product_sku: item.sku,
                product_category: item.category,
                quantity: item.quantity,
                unit_price: item.priceSale || item.price_sale,
                total_price: (item.priceSale || item.price_sale) * item.quantity
            }));

            const { error: itemsError } = await supabase
                .from('transaction_items')
                .insert(transactionItems);

            if (itemsError) throw itemsError;
        }

        return toCamelCase(newTransaction) as Transaction;
    },

    // Buscar transações por período COM itens
    async getByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
        const { data, error } = await supabase
            .from('transactions')
            .select('*, transaction_items(*)')
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: false });

        if (error) throw error;
        const withItems = (data || []).map((row: any) => this._mapTransactionWithItems(row));
        return toCamelCase(withItems) as Transaction[];
    },

    // Buscar transações por Cliente
    async getByCustomerId(customerId: string): Promise<Transaction[]> {
        const { data, error } = await supabase
            .from('transactions')
            .select('*, transaction_items(*)')
            .eq('customer_id', customerId)
            .order('date', { ascending: false });

        if (error) throw error;
        const withItems = (data || []).map((row: any) => this._mapTransactionWithItems(row));
        return toCamelCase(withItems) as Transaction[];
    },

    // Buscar vendas do dia
    async getToday(): Promise<Transaction[]> {
        const today = new Date().toISOString().split('T')[0];
        return this.getByDateRange(today, today);
    },

    // Editar campos de uma transação (admin only - validado no front)
    async update(id: string, updates: {
        customerName?: string;
        paymentMethod?: string;
        discountValue?: number;
        notes?: string;
        status?: string;
        total?: number;
        sellerName?: string;
        sellerId?: string;
    }): Promise<void> {
        const updateData: any = { updated_at: new Date().toISOString() };
        if (updates.customerName !== undefined) updateData.customer_name = updates.customerName;
        if (updates.paymentMethod !== undefined) updateData.payment_method = updates.paymentMethod;
        if (updates.discountValue !== undefined) updateData.discount_value = updates.discountValue;
        if (updates.notes !== undefined) updateData.notes = updates.notes;
        if (updates.status !== undefined) updateData.status = updates.status;
        if (updates.total !== undefined) updateData.total = updates.total;
        if (updates.sellerName !== undefined) updateData.seller_name = updates.sellerName;
        if (updates.sellerId !== undefined) updateData.seller_id = updates.sellerId;

        const { error } = await supabase
            .from('transactions')
            .update(updateData)
            .eq('id', id);

        if (error) throw error;
    },

    // Deletar transação e seus itens (admin only)
    async delete(id: string): Promise<void> {
        // Delete items first (if no cascade FK)
        await supabase.from('transaction_items').delete().eq('transaction_id', id);
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) throw error;
    }
};


// =====================================================
// VALIDAÇÃO DE SENHA ADMIN (para ações protegidas)
// =====================================================
export async function validateAdminPassword(input: string): Promise<{ ok: boolean; reason?: 'wrong' | 'not_configured' | 'error' }> {
    if (!input || input.trim() === '') return { ok: false, reason: 'wrong' };
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, role, password, pin, active')
            .in('role', ['Administrador', 'Gerente'])
            .eq('active', true);

        if (error) return { ok: false, reason: 'error' };
        if (!data || data.length === 0) return { ok: false, reason: 'not_configured' };

        // Check if ANY admin user has a password/pin configured
        const hasAnyPassword = data.some((u: any) =>
            (u.password && u.password !== '') || (u.pin && u.pin !== '')
        );
        if (!hasAnyPassword) return { ok: false, reason: 'not_configured' };

        const match = data.some((u: any) =>
            (u.password && u.password === input) ||
            (u.pin && u.pin === input)
        );
        return { ok: match, reason: match ? undefined : 'wrong' };
    } catch {
        return { ok: false, reason: 'error' };
    }
}

// =====================================================
// SERVIÇO DE CONFIGURAÇÕES
// =====================================================

export const SettingsService = {
    // Buscar configurações
    async get(): Promise<CompanySettings | null> {
        const { data, error } = await supabase
            .from('company_settings')
            .select('*')
            .limit(1)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return toCamelCase(data) as CompanySettings;
    },

    // Atualizar configurações
    async update(settings: Partial<CompanySettings>): Promise<CompanySettings> {
        const settingsData = toSnakeCase(settings);

        // Buscar ID das configurações existentes
        const { data: existing } = await supabase
            .from('company_settings')
            .select('id')
            .limit(1)
            .single();

        if (existing) {
            // Atualizar
            const { data, error } = await supabase
                .from('company_settings')
                .update(settingsData)
                .eq('id', existing.id)
                .select()
                .single();

            if (error) throw error;
            return toCamelCase(data) as CompanySettings;
        } else {
            // Criar
            const { data, error } = await supabase
                .from('company_settings')
                .insert(settingsData)
                .select()
                .single();

            if (error) throw error;
            return toCamelCase(data) as CompanySettings;
        }
    }
};

// =====================================================
// SERVIÇO DE BUNDLES (KITS)
// =====================================================

export const BundleService = {
    // Criar bundle com componentes
    async createBundle(
        product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
        components: { productId: string; quantity: number }[]
    ): Promise<Product> {
        // 1. Criar o produto pai (kit)
        const productData = toSnakeCase(product);
        const { data: newProduct, error: productError } = await supabase
            .from('products')
            .insert(productData)
            .select()
            .single();

        if (productError) throw productError;

        // 2. Inserir componentes
        if (components && components.length > 0) {
            const bundleComponents = components.map(comp => ({
                bundle_id: newProduct.id,
                component_id: comp.productId,
                quantity: comp.quantity
            }));

            const { error: componentsError } = await supabase
                .from('bundle_components')
                .insert(bundleComponents);

            if (componentsError) throw componentsError;
        }

        return toCamelCase(newProduct) as Product;
    },

    // Buscar componentes de um bundle
    async getBundleComponents(bundleId: string): Promise<{ productId: string; quantity: number }[]> {
        const { data, error } = await supabase
            .from('bundle_components')
            .select('component_id, quantity')
            .eq('bundle_id', bundleId);

        if (error) throw error;

        return data.map(item => ({
            productId: item.component_id,
            quantity: item.quantity
        }));
    },

    // Deletar bundle (cascata deleta componentes automaticamente)
    async deleteBundle(bundleId: string): Promise<void> {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', bundleId);

        if (error) throw error;
    },

    // Atualizar bundle e seus componentes
    async updateBundle(
        bundleId: string,
        product: Partial<Product>,
        components?: { productId: string; quantity: number }[]
    ): Promise<Product> {
        // 1. Atualizar produto
        const productData = toSnakeCase(product);
        const { data: updated, error: updateError } = await supabase
            .from('products')
            .update(productData)
            .eq('id', bundleId)
            .select()
            .single();

        if (updateError) throw updateError;

        // 2. Se componentes foram fornecidos, atualizar
        if (components) {
            // Deletar componentes antigos
            await supabase
                .from('bundle_components')
                .delete()
                .eq('bundle_id', bundleId);

            // Inserir novos componentes
            if (components.length > 0) {
                const bundleComponents = components.map(comp => ({
                    bundle_id: bundleId,
                    component_id: comp.productId,
                    quantity: comp.quantity
                }));

                const { error: componentsError } = await supabase
                    .from('bundle_components')
                    .insert(bundleComponents);

                if (componentsError) throw componentsError;
            }
        }

        return toCamelCase(updated) as Product;
    }
};


// =====================================================
// DELIVERY SERVICE
// =====================================================

export const DeliveryService = {
    async getAll(): Promise<DeliveryOrder[]> {
        const { data, error } = await supabase.from('deliveries').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []).map(d => ({
            id: d.order_id,
            customerName: d.customer_name,
            phone: d.phone || '',
            address: d.address,
            city: d.city || '',
            source: d.source as any,
            method: d.method as any,
            status: d.status as any,
            itemsSummary: d.items_summary || '',
            totalValue: Number(d.total_value) || 0,
            fee: Number(d.fee) || 0,
            motoboyName: d.motoboy_name,
            trackingCode: d.tracking_code,
            notes: d.notes,
            date: d.created_at,
            payoutStatus: d.payout_status as any || 'Pending',
            routeOrder: d.route_order ?? null,
            paymentMethod: d.payment_method
        }));
    },

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

        const { data, error } = await supabase.from('deliveries').insert([deliveryData]).select().single();
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
            date: data.created_at,
            payoutStatus: data.payout_status as any
        };
    },

    async update(orderId: string, updates: Partial<DeliveryOrder>): Promise<DeliveryOrder> {
        const updateData: any = { updated_at: new Date().toISOString() };
        if (updates.status !== undefined) updateData.status = updates.status;
        if (updates.notes !== undefined) updateData.notes = updates.notes;
        if (updates.motoboyName !== undefined) updateData.motoboy_name = updates.motoboyName;
        if (updates.payoutStatus !== undefined) updateData.payout_status = updates.payoutStatus;
        if ('routeOrder' in updates) updateData.route_order = updates.routeOrder ?? null;

        const { data, error } = await supabase.from('deliveries').update(updateData).eq('order_id', orderId).select().single();
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
            date: data.created_at,
            payoutStatus: data.payout_status as any,
            routeOrder: data.route_order ?? null
        };
    },

    async delete(orderId: string): Promise<void> {
        const { error } = await supabase.from('deliveries').delete().eq('order_id', orderId);
        if (error) throw error;
    },

    async getPayoutReport(): Promise<Record<string, { count: number, totalFee: number }>> {
        // Only fetch pending payouts
        const { data, error } = await supabase
            .from('deliveries')
            .select('motoboy_name, fee')
            .eq('status', 'Entregue')
            .eq('method', 'Motoboy')
            .eq('payout_status', 'Pending'); // Filter only Pending

        if (error) throw error;

        const payoutByMotoboy: Record<string, { count: number, totalFee: number }> = {};
        (data || []).forEach(d => {
            const name = d.motoboy_name || 'Não Atribuído';
            if (!payoutByMotoboy[name]) payoutByMotoboy[name] = { count: 0, totalFee: 0 };
            payoutByMotoboy[name].count += 1;
            payoutByMotoboy[name].totalFee += Number(d.fee) || 0;
        });
        return payoutByMotoboy;
    },

    async markAsPaid(motoboyName: string): Promise<void> {
        const { error } = await supabase
            .from('deliveries')
            .update({ payout_status: 'Paid' })
            .eq('motoboy_name', motoboyName)
            .eq('status', 'Entregue')
            .eq('payout_status', 'Pending');

        if (error) throw error;
    },

    async getPaidPayoutReport(): Promise<Record<string, { count: number, totalFee: number }>> {
        const { data, error } = await supabase
            .from('deliveries')
            .select('motoboy_name, fee')
            .eq('status', 'Entregue')
            .eq('method', 'Motoboy')
            .eq('payout_status', 'Paid');

        if (error) throw error;

        const payoutByMotoboy: Record<string, { count: number, totalFee: number }> = {};
        (data || []).forEach(d => {
            const name = d.motoboy_name || 'Não Atribuído';
            if (!payoutByMotoboy[name]) payoutByMotoboy[name] = { count: 0, totalFee: 0 };
            payoutByMotoboy[name].count += 1;
            payoutByMotoboy[name].totalFee += Number(d.fee) || 0;
        });
        return payoutByMotoboy;
    },

    // Buscar lista detalhada de entregas pendentes de repasse de um motoboy
    async getPayoutDeliveries(motoboyName: string): Promise<DeliveryOrder[]> {
        const { data, error } = await supabase
            .from('deliveries')
            .select('*')
            .eq('status', 'Entregue')
            .eq('method', 'Motoboy')
            .eq('payout_status', 'Pending')
            .eq('motoboy_name', motoboyName)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return (data || []).map((d: any) => toCamelCase(d)) as DeliveryOrder[];
    }
};


// =====================================================
// SERVICE DE TAREFAS (TASKS)
// =====================================================

export const TaskService = {
    async getAll(): Promise<any[]> {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(d => ({
            id: d.id,
            title: d.title,
            description: d.description || '',
            assignedTo: d.assigned_to,
            createdBy: d.created_by,
            dueDate: d.due_date,
            priority: d.priority,
            status: d.status,
            createdAt: d.created_at
        }));
    },

    async create(task: { title: string, description: string, assignedTo: string, createdBy: string, dueDate: string, priority: string }): Promise<any> {
        const { data, error } = await supabase
            .from('tasks')
            .insert({
                title: task.title,
                description: task.description,
                assigned_to: task.assignedTo,
                created_by: task.createdBy,
                due_date: task.dueDate,
                priority: task.priority,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            title: data.title,
            description: data.description || '',
            assignedTo: data.assigned_to,
            createdBy: data.created_by,
            dueDate: data.due_date,
            priority: data.priority,
            status: data.status,
            createdAt: data.created_at
        };
    },

    async updateStatus(id: string, status: 'pending' | 'completed'): Promise<void> {
        const { error } = await supabase
            .from('tasks')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// =====================================================
// SERVICE DE METAS DE VENDAS (SALES GOALS)
// =====================================================

export const SalesGoalService = {
    // Buscar meta da loja (global)
    async getStoreGoal(periodStart: string, periodEnd: string): Promise<number> {
        const { data, error } = await supabase
            .from('store_sales_goal')
            .select('goal_amount')
            .gte('period_start', periodStart)
            .lte('period_end', periodEnd)
            .maybeSingle();

        if (error) {
            console.error("Error fetching store goal:", error);
            return 0;
        }

        return data ? Number(data.goal_amount) : 0;
    },

    // Buscar metas de todos os usuários
    async getUserGoals(periodStart: string, periodEnd: string): Promise<{ userGoals: Record<string, number>, goalTypes: Record<string, 'daily' | 'monthly'> }> {
        const { data, error } = await supabase
            .from('sales_goals')
            .select('user_id, goal_amount, goal_type')
            .gte('period_start', periodStart)
            .lte('period_end', periodEnd);

        if (error) {
            console.error("Error fetching user goals:", error);
            return { userGoals: {}, goalTypes: {} };
        }

        const userGoals: Record<string, number> = {};
        const goalTypes: Record<string, 'daily' | 'monthly'> = {};

        data?.forEach((item: any) => {
            if (item.user_id) {
                userGoals[item.user_id] = Number(item.goal_amount);
                goalTypes[item.user_id] = item.goal_type as 'daily' | 'monthly';
            }
        });

        return { userGoals, goalTypes };
    },

    // Salvar meta de usuário
    async saveUserGoal(userId: string, amount: number, type: 'daily' | 'monthly', periodStart: string, periodEnd: string): Promise<void> {
        // Upsert logic (requires unique constraint on user_id, period_start, period_end, goal_type)
        const { error } = await supabase
            .from('sales_goals')
            .upsert({
                user_id: userId,
                goal_amount: amount,
                goal_type: type,
                period_start: periodStart,
                period_end: periodEnd
            }, {
                onConflict: 'user_id, period_start, period_end, goal_type'
            });

        if (error) throw error;
    }
};

// =====================================================
// SERVIÇO DE PROMOÇÕES
// =====================================================

export const PromotionService = {
    // Buscar todas as promoções
    async getAll(): Promise<any[]> {
        const { data, error } = await supabase
            .from('promotions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(toCamelCase);
    },

    // Buscar promoção por ID
    async getById(id: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('promotions')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return toCamelCase(data);
    },

    // Criar promoção com produtos
    async create(promotion: any, productIds: string[]): Promise<any> {
        const promoData = toSnakeCase({
            name: promotion.name,
            description: promotion.description || '',
            discountType: promotion.discountType,
            discountValue: promotion.discountValue,
            startDate: promotion.startDate || null,
            endDate: promotion.endDate || null,
            status: promotion.status || 'active'
        });

        const { data, error } = await supabase
            .from('promotions')
            .insert(promoData)
            .select()
            .single();

        if (error) throw error;

        // Inserir produtos da promoção
        if (productIds.length > 0) {
            const promoProducts = productIds.map(pid => ({
                promotion_id: data.id,
                product_id: pid
            }));

            const { error: ppError } = await supabase
                .from('promotion_products')
                .insert(promoProducts);

            if (ppError) throw ppError;
        }

        return toCamelCase(data);
    },

    // Atualizar promoção
    async update(id: string, promotion: any, productIds?: string[]): Promise<any> {
        const promoData = toSnakeCase({
            name: promotion.name,
            description: promotion.description || '',
            discountType: promotion.discountType,
            discountValue: promotion.discountValue,
            startDate: promotion.startDate || null,
            endDate: promotion.endDate || null,
            status: promotion.status || 'active',
            updatedAt: new Date().toISOString()
        });

        const { data, error } = await supabase
            .from('promotions')
            .update(promoData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Atualizar produtos se fornecidos
        if (productIds !== undefined) {
            // Remove antigos
            await supabase.from('promotion_products').delete().eq('promotion_id', id);

            // Inserir novos
            if (productIds.length > 0) {
                const promoProducts = productIds.map(pid => ({
                    promotion_id: id,
                    product_id: pid
                }));

                const { error: ppError } = await supabase
                    .from('promotion_products')
                    .insert(promoProducts);

                if (ppError) throw ppError;
            }
        }

        return toCamelCase(data);
    },

    // Deletar promoção (cascade deleta promotion_products)
    async delete(id: string): Promise<void> {
        const { error } = await supabase.from('promotions').delete().eq('id', id);
        if (error) throw error;
    },

    // Buscar produtos de uma promoção
    async getProducts(promotionId: string): Promise<string[]> {
        const { data, error } = await supabase
            .from('promotion_products')
            .select('product_id')
            .eq('promotion_id', promotionId);

        if (error) throw error;
        return (data || []).map((d: any) => d.product_id);
    }
};
