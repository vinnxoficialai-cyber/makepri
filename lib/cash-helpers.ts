// Helper para mapear dados do Supabase para exibição
export function mapCashMovementForDisplay(mov: any) {
    // Mapear types do Supabase para display
    const typeMap: Record<string, string> = {
        'opening': 'Abertura',
        'sale': 'Venda',
        'withdrawal': 'Sangria',
        'supply': 'Suprimento'
    };
    const displayType = typeMap[mov.type] || mov.type;

    // Mapear paymentMethod para display
    const methodMap: Record<string, string> = {
        'cash': 'Dinheiro',
        'credit': 'Cartão de Crédito',
        'debit': 'Cartão de Débito',
        'pix': 'Pix'
    };
    const displayMethod = methodMap[mov.paymentMethod] || mov.paymentMethod;

    // Extrair data e hora de createdAt
    const movDate = new Date(mov.createdAt);
    const dateStr = movDate.toLocaleDateString('pt-BR');
    const timeStr = movDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return {
        ...mov,
        displayType,
        displayMethod,
        dateStr,
        timeStr
    };
}
