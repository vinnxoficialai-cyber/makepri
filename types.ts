
export enum ProductCategory {
    COSMETIC = 'Cosmético',
    CLOTHING = 'Roupa',
    ACCESSORY = 'Acessório',
    ELECTRONIC = 'Eletrônico',
    BUNDLE = 'Kit / Combo' // New Category
}

export interface BundleComponent {
    productId: string;
    quantity: number;
}

export interface Product {
    id: string;
    sku: string;
    name: string;
    category: ProductCategory;
    priceCost: number;
    priceSale: number;
    stock: number;
    minStock: number;
    unit: string;
    imageUrl?: string;
    additionalImages?: string[];
    expiryDate?: string;
    // Extended fields
    brand?: string;
    size?: string;
    color?: string;
    segment?: string;
    collection?: string;
    description?: string;
    supplier?: string;
    createdAt?: string;
    updatedAt?: string;
    commissionRate?: number;
    // Bundle specific
    type?: 'single' | 'bundle'; // 'single' is default
    bundleComponents?: BundleComponent[];
    // Promotion
    isPromotion?: boolean;
    pricePromotion?: number;
    isActive?: boolean;
    variations?: ProductVariation[];
}

export interface ProductVariation {
    id: string;
    productId: string;
    name: string; // "P", "Vermelho"
    type: string; // "Tamanho", "Cor"
    stock: number;
    sku?: string;
    priceOverride?: number;
    createdAt?: string;
}

export interface CompanySettings {
    name: string;
    logoUrl: string;
    logoWidth: number; // Percentage or px width
    cnpj?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    website?: string;
    receiptMessage?: string;
}

export interface SalesGoal {
    storeGoal: number;
    userGoals: Record<string, number>; // Map userId to goal amount (value)
    goalTypes: Record<string, 'daily' | 'monthly'>; // Map userId to goal type
}

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    cpf?: string;
    address?: string;
    city?: string;
    state?: string;
    birthDate?: string;
    totalSpent: number;
    lastPurchase: string;
    status: 'Active' | 'Inactive';
    notes?: string;
    isActive?: boolean;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    assignedTo: string;
    createdBy: string;
    dueDate: string;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'completed';
}

export interface DeliveryOrder {
    id: string;
    customerName: string;
    phone: string;
    address: string;
    city: string;
    source: 'WhatsApp' | 'E-commerce' | 'Loja Física';
    method: 'Motoboy' | 'Correios' | 'Jadlog' | 'Retirada';
    trackingCode?: string;
    status: 'Pendente' | 'Em Preparo' | 'Em Rota' | 'Entregue' | 'Cancelado' | 'Problema';
    totalValue: number;
    fee?: number; // Delivery fee specific for payout
    motoboyName?: string; // Specific motoboy assigned
    notes?: string; // Observation field
    date: string;
    itemsSummary: string; // Ex: "2x Batom, 1x Base"
    payoutStatus?: 'Pending' | 'Paid'; // Status do repasse para o motoboy
}

export interface CartItem extends Product {
    quantity: number;
    variationId?: string;
    variationName?: string;
}

export interface Transaction {
    id: string;
    date: string;
    customerName: string;
    total: number;
    status: 'Completed' | 'Pending' | 'Cancelled';
    type: 'Sale' | 'Refund';
    // Extended properties for Receipt History
    items?: CartItem[];
    paymentMethod?: string;
    installments?: number;
    subTotal?: number;
    discountValue?: number;
    deliveryFee?: number;
    changeAmount?: number;
    isDelivery?: boolean;
    motoboy?: string;
    customerId?: string;
    customerSnapshot?: Customer | null;
    // Vendedor responsável
    sellerId?: string;
    sellerName?: string;

    created_at?: string;
    updated_at?: string;
}

export interface FinancialRecord {
    id: string;
    description: string;
    amount: number;
    type: 'Income' | 'Expense';
    date: string;
    category: string;
    status: 'Paid' | 'Pending';
}
// Cash Register Types
export interface CashRegister {
    id: string;
    openedAt: string;
    closedAt?: string;
    openedBy: string;
    closedBy?: string;
    openingBalance: number;
    closingBalance?: number;
    expectedBalance?: number;
    difference?: number;
    status: 'open' | 'closed';
    notes?: string;
}

export interface CashMovement {
    id: string;
    cashRegisterId: string;
    type: 'opening' | 'sale' | 'withdrawal' | 'supply';
    description: string;
    amount: number;
    paymentMethod: 'cash' | 'credit' | 'debit' | 'pix';
    transactionId?: string;
    createdBy?: string;
    createdAt: string;
}
// Promotion Types
export interface Promotion {
    id: string;
    name: string;
    description?: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    startDate?: string;
    endDate?: string;
    status: 'active' | 'inactive' | 'scheduled';
    createdAt?: string;
    updatedAt?: string;
}

export interface PromotionProduct {
    id: string;
    promotionId: string;
    productId: string;
}

export type ModuleType = 'dashboard' | 'inventory' | 'pos' | 'crm' | 'finance' | 'reports' | 'cash' | 'settings' | 'ecommerce' | 'tasks' | 'bundles' | 'ai' | 'goals' | 'delivery' | 'team' | 'promotions';
export type UserRole = 'Administrador' | 'Gerente' | 'Vendedor' | 'Estoquista' | 'Caixa' | 'Motoboy';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    permissions: ModuleType[];
    avatarUrl?: string;
    active: boolean;
    defaultGoal?: number; // Persisted default goal (monthly value base)
    defaultGoalType?: 'daily' | 'monthly'; // Preference for viewing/editing
}
