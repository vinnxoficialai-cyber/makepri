
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
