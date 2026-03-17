import { supabase } from './supabase';

// =====================================================
// SERVICO DE AUDITORIA
// Registra acoes criticas: deletes, edits, estornos
// =====================================================

export interface AuditEntry {
    action: string;        // 'delete_transaction', 'edit_transaction', 'merge_customers', etc.
    entityType: string;    // 'transaction', 'customer', 'product', etc.
    entityId?: string;
    userId?: string;
    userName?: string;
    details?: Record<string, any>;
}

export const AuditService = {
    async log(entry: AuditEntry): Promise<void> {
        try {
            await supabase.from('audit_log').insert({
                action: entry.action,
                entity_type: entry.entityType,
                entity_id: entry.entityId || null,
                user_id: entry.userId || null,
                user_name: entry.userName || null,
                details: entry.details || null
            });
        } catch (err) {
            // Never break the main flow due to audit failure
            console.error('[AuditService] Failed to log:', err);
        }
    },

    async getRecent(limit: number = 50): Promise<any[]> {
        const { data, error } = await supabase
            .from('audit_log')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    },

    async getByEntity(entityType: string, entityId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('audit_log')
            .select('*')
            .eq('entity_type', entityType)
            .eq('entity_id', entityId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }
};
