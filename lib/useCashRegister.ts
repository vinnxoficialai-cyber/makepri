import { useState, useEffect } from 'react';
import { CashService } from './cash-service';
import type { CashRegister, CashMovement } from '../types';

// =====================================================
// HOOK: useCashRegister
// =====================================================

export function useCashRegister() {
    const [currentRegister, setCurrentRegister] = useState<CashRegister | null>(null);
    const [movements, setMovements] = useState<CashMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Buscar caixa aberto e suas movimentações
    const loadCurrentRegister = async () => {
        try {
            setLoading(true);
            setError(null);

            const register = await CashService.getCurrentRegister();
            setCurrentRegister(register);

            if (register) {
                const registerMovements = await CashService.getMovements(register.id);
                setMovements(registerMovements);
            } else {
                setMovements([]);
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar caixa');
            console.error('Erro ao carregar caixa:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCurrentRegister();
    }, []);

    // Abrir caixa
    const openRegister = async (openingBalance: number, openedBy: string) => {
        try {
            setError(null);
            const newRegister = await CashService.openRegister(openingBalance, openedBy);
            setCurrentRegister(newRegister);

            // Criar movimento de abertura
            const openingMovement = await CashService.addMovement({
                cashRegisterId: newRegister.id,
                type: 'opening',
                description: 'Abertura de Caixa',
                amount: openingBalance,
                paymentMethod: 'cash',
                createdBy: openedBy
            });

            setMovements([openingMovement]);
            return newRegister;
        } catch (err: any) {
            setError(err.message || 'Erro ao abrir caixa');
            throw err;
        }
    };

    // Fechar caixa
    const closeRegister = async (
        closingBalance: number,
        expectedBalance: number,
        closedBy: string,
        notes?: string
    ) => {
        try {
            if (!currentRegister) {
                throw new Error('Nenhum caixa aberto');
            }

            setError(null);
            const closedRegister = await CashService.closeRegister(
                currentRegister.id,
                closingBalance,
                expectedBalance,
                closedBy,
                notes
            );

            setCurrentRegister(null);
            setMovements([]);
            return closedRegister;
        } catch (err: any) {
            setError(err.message || 'Erro ao fechar caixa');
            throw err;
        }
    };

    // Adicionar movimentação
    const addMovement = async (movement: Omit<CashMovement, 'id' | 'createdAt' | 'cashRegisterId'>) => {
        try {
            if (!currentRegister) {
                throw new Error('Nenhum caixa aberto');
            }

            setError(null);
            const newMovement = await CashService.addMovement({
                ...movement,
                cashRegisterId: currentRegister.id
            });

            setMovements(prev => [...prev, newMovement]);
            return newMovement;
        } catch (err: any) {
            setError(err.message || 'Erro ao adicionar movimentação');
            throw err;
        }
    };

    // Buscar histórico
    const fetchHistory = async (limit?: number) => {
        try {
            setError(null);
            return await CashService.getHistory(limit);
        } catch (err: any) {
            setError(err.message || 'Erro ao buscar histórico');
            throw err;
        }
    };

    // Buscar saldo anterior
    const getPreviousBalance = async () => {
        try {
            const lastRegister = await CashService.getLastClosedRegister();
            return lastRegister ? lastRegister.closingBalance : 0;
        } catch (err) {
            console.error('Erro ao buscar saldo anterior:', err);
            return 0;
        }
    };

    // Calcular totais
    const calculateTotals = () => {
        const opening = movements.find(m => m.type === 'opening')?.amount || 0;

        const cashSales = movements
            .filter(m => m.type === 'sale' && m.paymentMethod === 'cash')
            .reduce((acc, curr) => acc + curr.amount, 0);

        const cardSales = movements
            .filter(m => m.type === 'sale' && (m.paymentMethod === 'credit' || m.paymentMethod === 'debit'))
            .reduce((acc, curr) => acc + curr.amount, 0);

        const pixSales = movements
            .filter(m => m.type === 'sale' && m.paymentMethod === 'pix')
            .reduce((acc, curr) => acc + curr.amount, 0);

        const withdrawals = movements
            .filter(m => m.type === 'withdrawal')
            .reduce((acc, curr) => acc + curr.amount, 0);

        const supplies = movements
            .filter(m => m.type === 'supply')
            .reduce((acc, curr) => acc + curr.amount, 0);

        const currentDrawerBalance = opening + cashSales + supplies - withdrawals;

        return {
            opening,
            cashSales,
            cardSales,
            pixSales,
            withdrawals,
            supplies,
            currentDrawerBalance,
            totalSales: cashSales + cardSales + pixSales
        };
    };

    return {
        currentRegister,
        movements,
        loading,
        error,
        isOpen: currentRegister?.status === 'open',
        openRegister,
        closeRegister,
        addMovement,
        fetchHistory,
        getPreviousBalance,
        refresh: loadCurrentRegister,
        calculateTotals
    };
}
