import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Filter,
  History,
  Lock,
  QrCode,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Unlock,
  Wallet,
  X,
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { EmptyState } from '../components/ds/layout';
import { CustomDropdown } from '../components/ds/CustomDropdown';
import { mapCashMovementForDisplay } from '../lib/cash-helpers';
import { CashService } from '../lib/cash-service';
import { useCashRegister } from '../lib/useCashRegister';

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const getLocalDate = (value: string) => new Date(value).toLocaleDateString('en-CA');

type CashMovementItem = any;

type ModalShellProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  footer: React.ReactNode;
  maxWidthClass?: string;
};

const primaryPink = '#ffc8cb';
const pageTone = '#fff9fa';

const glassCard =
  'rounded-[30px] border border-rose-100/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)]';
const softPinkCard =
  'rounded-[28px] border border-rose-100 bg-[linear-gradient(180deg,#fff6f7_0%,#ffffff_100%)] shadow-[0_18px_42px_rgba(255,200,203,0.22)]';
const tinyLabel = 'text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500';
const titleClass = 'text-lg font-semibold tracking-tight text-slate-900';
const descClass = 'text-sm leading-6 text-slate-500';

const iconToneMap = {
  rose: 'border-rose-100 bg-rose-50 text-rose-500',
  emerald: 'border-emerald-100 bg-emerald-50 text-emerald-600',
  slate: 'border-slate-100 bg-slate-50 text-slate-700',
  amber: 'border-amber-100 bg-amber-50 text-amber-600',
};

const KpiCard: React.FC<{
  label: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
  tone?: keyof typeof iconToneMap;
}> = ({ label, value, helper, icon, tone = 'slate' }) => {
  return (
    <div className="rounded-[24px] border border-rose-100/70 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <h3 className="mt-2 text-[2rem] font-semibold tracking-tight text-slate-900">{value}</h3>
        </div>
        <div className={`rounded-[18px] border p-3 ${iconToneMap[tone]}`}>{icon}</div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{helper}</p>
    </div>
  );
};

const actionIconTones = {
  rose: 'border-rose-100 bg-rose-50 text-rose-500',
  emerald: 'border-emerald-100 bg-emerald-50 text-emerald-600',
  red: 'border-red-100 bg-red-50 text-red-500',
  slate: 'border-slate-100 bg-slate-50 text-slate-600',
};

const cardTones = {
  default: {
    card: 'border-rose-100 bg-white hover:border-rose-200 hover:shadow-[0_18px_34px_rgba(15,23,42,0.06)]',
    icon: '',
    text: 'text-slate-500',
    title: 'text-slate-900',
  },
  slate: {
    card: 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)]',
    icon: 'border-slate-200 bg-slate-100 text-slate-600',
    text: 'text-slate-500',
    title: 'text-slate-800',
  },
  emerald: {
    card: 'border-emerald-200 bg-emerald-50 hover:border-emerald-300 hover:shadow-[0_12px_24px_rgba(5,150,105,0.1)]',
    icon: 'border-emerald-200 bg-emerald-100 text-emerald-600',
    text: 'text-emerald-600/70',
    title: 'text-emerald-700',
  },
  red: {
    card: 'border-red-200 bg-red-50 hover:border-red-300 hover:shadow-[0_12px_24px_rgba(239,68,68,0.1)]',
    icon: 'border-red-200 bg-red-100 text-red-500',
    text: 'text-red-500/70',
    title: 'text-red-700',
  },
};

const ActionCard: React.FC<{
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  cardTone?: keyof typeof cardTones;
  iconTone?: keyof typeof actionIconTones;
}> = ({ title, subtitle, icon, onClick, disabled = false, cardTone = 'default', iconTone = 'rose' }) => {
  const tone = cardTones[cardTone];
  const isSolid = cardTone !== 'default';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group flex min-h-[100px] flex-col rounded-[20px] border p-3.5 text-left transition-all hover:-translate-y-0.5 ${tone.card} disabled:cursor-not-allowed disabled:opacity-45`}
    >
      <div
        className={`mb-auto inline-flex rounded-[14px] border p-2 ${isSolid ? tone.icon : actionIconTones[iconTone]}`}
      >
        {icon}
      </div>
      <div className="mt-2">
        <p className={`text-[11px] font-medium ${tone.text}`}>{subtitle}</p>
        <p className={`mt-0.5 text-sm font-semibold tracking-tight ${tone.title}`}>{title}</p>
      </div>
    </button>
  );
};

const StatusPill: React.FC<{ open: boolean }> = ({ open }) => (
  <div
    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${open ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
      }`}
  >
    <span className={`h-2 w-2 rounded-full ${open ? 'bg-rose-400' : 'bg-slate-300'}`} />
    {open ? 'Caixa aberto' : 'Caixa fechado'}
  </div>
);

const CompactStat: React.FC<{
  label: string;
  value: string;
  helper: string;
  emphasis?: boolean;
}> = ({ label, value, helper, emphasis = false }) => (
  <div
    className={`rounded-[22px] border p-4 ${emphasis ? 'border-rose-100 bg-[#fff7f8]' : 'border-rose-100/70 bg-white'
      }`}
  >
    <p className="text-xs font-medium text-slate-500">{label}</p>
    <p className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900 truncate">{value}</p>
    <p className="mt-0.5 text-[11px] text-slate-500">{helper}</p>
  </div>
);

const InfoRow: React.FC<{
  label: string;
  value: string;
}> = ({ label, value }) => (
  <div className="rounded-[22px] border border-rose-100 bg-white px-4 py-4">
    <p className="text-xs font-medium text-slate-500">{label}</p>
    <p className="mt-2 text-lg font-semibold tracking-tight text-slate-900">{value}</p>
  </div>
);

const ModalShell: React.FC<ModalShellProps> = ({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  maxWidthClass = 'max-w-md',
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgba(15,23,42,0.28)] backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${maxWidthClass} overflow-hidden rounded-[32px] border border-rose-100 bg-white shadow-[0_32px_80px_rgba(15,23,42,0.14)]`}>
        <div className="flex items-start justify-between gap-4 border-b border-rose-100 bg-[linear-gradient(180deg,#fff6f7_0%,#ffffff_100%)] px-6 py-5">
          <div>
            <h3 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-900">
              {icon}
              {title}
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-6">{children}</div>
        <div className="flex gap-3 border-t border-rose-100 bg-white px-6 py-4">{footer}</div>
      </div>
    </div>
  );
};

const Cash: React.FC = () => {
  const {
    currentRegister,
    movements,
    loading,
    isOpen,
    openRegister,
    closeRegister,
    addMovement,
    calculateTotals,
    getPreviousBalance,
    refresh,
  } = useCashRegister();

  const toast = useToast();
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showSangriaModal, setShowSangriaModal] = useState(false);
  const [showSuprimentoModal, setShowSuprimentoModal] = useState(false);
  const [historyFilters, setHistoryFilters] = useState({
    search: '',
    method: 'Todos',
    date: new Date().toISOString().split('T')[0],
  });
  const [historyMovements, setHistoryMovements] = useState<CashMovementItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [openingFloat, setOpeningFloat] = useState<number>(0);
  const [closingCount, setClosingCount] = useState<number>(0);
  const [sangriaForm, setSangriaForm] = useState({ amount: '', type: 'sangria', description: '' });
  const [suprimentoForm, setSuprimentoForm] = useState({ amount: '', description: '' });

  const totals = calculateTotals();
  const PAGE_SIZE = 15;
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!showSangriaModal) return;
    if (sangriaForm.type === 'sangria') {
      setSangriaForm((prev) => ({ ...prev, description: 'Sangria para cofre/banco' }));
    } else if (sangriaForm.description === 'Sangria para cofre/banco') {
      setSangriaForm((prev) => ({ ...prev, description: '' }));
    }
  }, [sangriaForm.type, sangriaForm.description, showSangriaModal]);

  useEffect(() => {
    if (!showOpenModal) return;
    getPreviousBalance().then((prevBal) => {
      if (prevBal > 0) setOpeningFloat(prevBal);
    });
  }, [getPreviousBalance, showOpenModal]);

  useEffect(() => {
    if (!showHistoryModal) return;

    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const data = historyFilters.date
          ? await CashService.getMovementsForDate(historyFilters.date)
          : await CashService.getAllMovements();
        setHistoryMovements(data);
      } catch (error) {
        console.error('Erro ao buscar histórico:', error);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [historyFilters.date, showHistoryModal]);

  useEffect(() => {
    setHistoryPage(1);
  }, [historyFilters]);

  const metrics = useMemo(() => {
    const salesMovements = movements.filter((m) => m.type === 'sale');
    const digitalTotal = totals.cardSales + totals.pixSales;
    const cashShare = totals.totalSales > 0 ? (totals.cashSales / totals.totalSales) * 100 : 0;
    const averageTicket = salesMovements.length > 0 ? totals.totalSales / salesMovements.length : 0;
    const drawerTarget = Math.max(totals.opening, 150);
    const excessInDrawer = Math.max(0, totals.currentDrawerBalance - drawerTarget);
    const registerOpenMinutes = currentRegister
      ? Math.max(0, Math.floor((Date.now() - new Date(currentRegister.openedAt).getTime()) / 60000))
      : 0;

    const alerts = [
      !isOpen ? 'Caixa fechado. Abra o caixa para iniciar a operação.' : null,
      isOpen && registerOpenMinutes >= 600
        ? 'Caixa aberto há muito tempo. Vale revisar o fechamento.'
        : null,
      isOpen && excessInDrawer > 0
        ? `Dinheiro acima da meta sugerida de gaveta em ${formatCurrency(excessInDrawer)}.`
        : null,
      isOpen && totals.withdrawals === 0 && totals.currentDrawerBalance > 500
        ? 'Sem sangria registrada apesar de alto valor em espécie.'
        : null,
    ].filter(Boolean) as string[];

    return {
      salesCount: salesMovements.length,
      digitalTotal,
      cashShare,
      averageTicket,
      withdrawalsCount: movements.filter((m) => m.type === 'withdrawal').length,
      suppliesCount: movements.filter((m) => m.type === 'supply').length,
      lastMovement: movements[movements.length - 1] ?? null,
      registerOpenMinutes,
      drawerTarget,
      alerts,
    };
  }, [currentRegister, isOpen, movements, totals]);

  const filteredMovements = useMemo(() => {
    return historyMovements.filter((m) => {
      const query = historyFilters.search.toLowerCase();
      const methodMap: Record<string, string> = {
        cash: 'Dinheiro',
        credit: 'Cartão Crédito',
        debit: 'Cartão Débito',
        pix: 'Pix',
      };
      const displayMethod = methodMap[m.paymentMethod] || m.paymentMethod || '';
      const matchSearch =
        !query ||
        (m.description || '').toLowerCase().includes(query) ||
        (m.type || '').toLowerCase().includes(query);
      const matchMethod = historyFilters.method === 'Todos' || displayMethod === historyFilters.method;
      return matchSearch && matchMethod;
    });
  }, [historyFilters.method, historyFilters.search, historyMovements]);

  const totalPages = Math.max(1, Math.ceil(filteredMovements.length / PAGE_SIZE));
  const paginatedMovements = filteredMovements.slice(
    (historyPage - 1) * PAGE_SIZE,
    historyPage * PAGE_SIZE,
  );
  const closeDifference = closingCount > 0 ? closingCount - totals.currentDrawerBalance : 0;

  const handleOpenRegister = async () => {
    if (openingFloat === undefined || Number.isNaN(openingFloat) || openingFloat < 0) {
      toast.info('Informe um valor válido para o fundo de troco.');
      return;
    }

    try {
      await openRegister(openingFloat, 'Usuário Atual');
      setShowOpenModal(false);
      setOpeningFloat(0);
      toast.success('Caixa aberto com sucesso.');
    } catch (error: any) {
      console.error('Erro ao abrir caixa:', error);
      toast.error(`Erro ao abrir caixa: ${error.message}`);
    }
  };

  const handleCloseRegister = async () => {
    try {
      await closeRegister(
        closingCount,
        totals.currentDrawerBalance,
        'Usuário Atual',
        `Fechamento - Diferença: ${formatCurrency(closingCount - totals.currentDrawerBalance)}`,
      );
      setShowCloseModal(false);
      setClosingCount(0);
      toast.success('Caixa fechado com sucesso.');
    } catch (error) {
      console.error('Erro ao fechar caixa:', error);
      toast.error('Erro ao fechar caixa. Tente novamente.');
    }
  };

  const handleSaveSangria = async () => {
    const amount = parseFloat(sangriaForm.amount);
    if (!amount || amount <= 0) return toast.info('Informe um valor válido.');
    if (!sangriaForm.description.trim()) return toast.info('Informe uma descrição para a retirada.');
    if (
      amount > totals.currentDrawerBalance &&
      !confirm('A retirada é maior que o saldo registrado. Deseja continuar?')
    )
      return;

    try {
      await addMovement({
        type: 'withdrawal',
        description: sangriaForm.description,
        amount,
        paymentMethod: 'cash',
      });
      setShowSangriaModal(false);
      setSangriaForm({ amount: '', type: 'sangria', description: '' });
      toast.success('Sangria registrada com sucesso.');
    } catch (error) {
      console.error('Erro ao registrar sangria:', error);
      toast.error('Erro ao registrar sangria.');
    }
  };

  const handleSaveSuprimento = async () => {
    const amount = parseFloat(suprimentoForm.amount);
    if (!amount || amount <= 0) return toast.info('Informe um valor válido.');
    if (!suprimentoForm.description.trim()) return toast.info('Informe uma descrição para o suprimento.');

    try {
      await addMovement({
        type: 'supply',
        description: suprimentoForm.description,
        amount,
        paymentMethod: 'cash',
      });
      setShowSuprimentoModal(false);
      setSuprimentoForm({ amount: '', description: '' });
      toast.success('Suprimento registrado com sucesso.');
    } catch (error) {
      console.error('Erro ao registrar suprimento:', error);
      toast.error('Erro ao registrar suprimento.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center rounded-[32px] border border-rose-100 bg-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-rose-100 border-t-rose-300" />
          <p className="text-sm font-medium text-slate-500">Carregando caixa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[var(--cash-page-tone,#fff9fa)] text-slate-800">
      <section className="overflow-hidden rounded-[34px] border border-rose-100 bg-[linear-gradient(180deg,#fff7f8_0%,#fffefe_100%)] shadow-[0_20px_60px_rgba(255,200,203,0.25)]">
        <div className="space-y-6 p-5 sm:p-6 lg:p-8">
          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-3.5 py-1.5 text-xs font-semibold tracking-[0.08em] text-slate-600 shadow-sm">
                <Sparkles size={14} className="text-rose-400" />
                Caixa inteligente
              </div>

              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-[2.7rem]">
                  Controle de Caixa
                </h2>
                <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-600">
                  Um painel operacional claro e sofisticado para abertura, conferência,
                  acompanhamento e decisões rápidas do caixa, com linguagem totalmente branca e rosa.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ActionCard
                title={isOpen ? 'Fechar caixa' : 'Abrir caixa'}
                subtitle={isOpen ? 'Encerrar operação' : 'Iniciar operação'}
                icon={isOpen ? <Lock size={16} /> : <Unlock size={16} />}
                onClick={() => (isOpen ? setShowCloseModal(true) : setShowOpenModal(true))}
                cardTone="slate"
              />
              <ActionCard
                title="Suprimento"
                subtitle="Entrada manual"
                icon={<ArrowUpCircle size={16} />}
                onClick={() => setShowSuprimentoModal(true)}
                disabled={!isOpen}
                cardTone="emerald"
              />
              <ActionCard
                title="Sangria"
                subtitle="Saída controlada"
                icon={<ArrowDownCircle size={16} />}
                onClick={() => setShowSangriaModal(true)}
                disabled={!isOpen}
                cardTone="red"
              />
              <ActionCard
                title="Atualizar"
                subtitle="Sincronização"
                icon={<RefreshCw size={16} />}
                onClick={() => {
                  refresh();
                  toast.success('Dados do caixa atualizados.');
                }}
                iconTone="slate"
              />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
            <div className={`${glassCard} p-5 sm:p-6`}>
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                <div>
                  <StatusPill open={isOpen} />
                  <p className="mt-4 text-sm leading-6 text-slate-500">
                    {currentRegister
                      ? `Aberto em ${new Date(currentRegister.openedAt).toLocaleString('pt-BR')}`
                      : 'Nenhum caixa aberto no momento.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
                  <CompactStat
                    label="Saldo em gaveta"
                    value={formatCurrency(totals.currentDrawerBalance)}
                    helper="Valor físico disponível"
                    emphasis
                  />
                  <CompactStat
                    label="Vendas totais"
                    value={formatCurrency(totals.totalSales)}
                    helper="Receita acumulada"
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <CompactStat
                  label="Dinheiro"
                  value={formatCurrency(totals.cashSales)}
                  helper={`${Math.round(metrics.cashShare)}% das vendas`}
                  emphasis
                />
                <CompactStat
                  label="Digital"
                  value={formatCurrency(metrics.digitalTotal)}
                  helper="Pix + cartões"
                />
                <CompactStat
                  label="Ticket médio"
                  value={formatCurrency(metrics.averageTicket)}
                  helper={`${metrics.salesCount} venda(s)`}
                />
                <CompactStat
                  label="Tempo aberto"
                  value={isOpen ? `${Math.floor(metrics.registerOpenMinutes / 60)}h ${metrics.registerOpenMinutes % 60}m` : '--'}
                  helper="Monitoramento operacional"
                />
              </div>
            </div>

            <div className={`${softPinkCard} p-5 sm:p-6`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={tinyLabel}>Saúde do caixa</p>
                  <h3 className="mt-2 text-[1.7rem] font-semibold tracking-tight text-slate-900">
                    Leitura rápida da operação
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Destaques operacionais e pontos de atenção com foco em leitura imediata.
                  </p>
                </div>
                <div className="rounded-[18px] border border-rose-100 bg-white p-2.5 text-rose-400 shadow-sm">
                  <ShieldAlert size={18} />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {metrics.alerts.length > 0 ? (
                  metrics.alerts.map((alert) => (
                    <div key={alert} className="rounded-[22px] border border-rose-100 bg-white px-4 py-4 shadow-sm">
                      <p className="text-sm leading-6 text-slate-700">{alert}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[22px] border border-emerald-100 bg-emerald-50 px-4 py-4 shadow-sm">
                    <p className="text-sm font-semibold text-emerald-700">Operação saudável</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Nenhum alerta operacional relevante neste momento.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <InfoRow label="Sangrias" value={String(metrics.withdrawalsCount)} />
                <InfoRow label="Suprimentos" value={String(metrics.suppliesCount)} />
                <InfoRow label="Meta gaveta" value={formatCurrency(metrics.drawerTarget)} />
                <InfoRow
                  label="Último movimento"
                  value={
                    metrics.lastMovement
                      ? new Date(metrics.lastMovement.createdAt).toLocaleTimeString('pt-BR')
                      : '--'
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Saldo inicial"
          value={formatCurrency(totals.opening)}
          helper="Fundo configurado na abertura do caixa."
          icon={<Wallet size={20} />}
          tone="rose"
        />
        <KpiCard
          label="Entradas em espécie"
          value={formatCurrency(totals.cashSales)}
          helper={`${metrics.salesCount} venda(s) registradas hoje.`}
          icon={<Banknote size={20} />}
          tone="emerald"
        />
        <KpiCard
          label="Saídas e sangrias"
          value={formatCurrency(totals.withdrawals)}
          helper="Controle de retiradas e proteção de gaveta."
          icon={<ArrowDownCircle size={20} />}
          tone="rose"
        />
        <KpiCard
          label="Pix e cartões"
          value={formatCurrency(metrics.digitalTotal)}
          helper="Receita digital fora do saldo físico da gaveta."
          icon={<CreditCard size={20} />}
          tone="slate"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
        <div className={`${glassCard} overflow-hidden`}>
          <div className="flex flex-col gap-4 border-b border-rose-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h3 className={titleClass}>Movimentações recentes</h3>
              <p className={descClass}>
                Últimos registros do caixa atual, organizados para leitura rápida em desktop e mobile.
              </p>
            </div>
            <button
              onClick={() => setShowHistoryModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-[#fff4f5] px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-[#ffe8ea]"
            >
              <History size={16} className="text-rose-400" />
              Ver histórico completo
            </button>
          </div>

          <div className="divide-y divide-rose-100/80">
            {movements.length > 0 ? (
              movements
                .slice()
                .reverse()
                .slice(0, 6)
                .map((mov) => {
                  const mapped = mapCashMovementForDisplay(mov);
                  const isNegative = mapped.displayType === 'Sangria';

                  return (
                    <div
                      key={mov.id}
                      className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${mapped.displayType === 'Venda'
                                ? 'bg-slate-100 text-slate-700'
                                : mapped.displayType === 'Sangria'
                                  ? 'bg-rose-100 text-rose-700'
                                  : mapped.displayType === 'Suprimento'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-amber-100 text-amber-700'
                              }`}
                          >
                            {mapped.displayType}
                          </span>
                          <span className="text-xs text-slate-400">
                            {mapped.dateStr} · {mapped.timeStr}
                          </span>
                        </div>

                        <p className="mt-2 truncate text-sm font-semibold text-slate-900">{mov.description}</p>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          {mapped.displayMethod === 'Pix' && <QrCode size={12} className="text-teal-500" />}
                          {mapped.displayMethod?.includes('Cartão') && (
                            <CreditCard size={12} className="text-slate-600" />
                          )}
                          {mapped.displayMethod === 'Dinheiro' && (
                            <Banknote size={12} className="text-emerald-500" />
                          )}
                          <span>{mapped.displayMethod || 'Sem método'}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`text-sm font-semibold ${isNegative ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {isNegative ? '-' : '+'} {formatCurrency(mapped.amount)}
                        </p>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="px-5 py-12 sm:px-6">
                <EmptyState
                  title="Sem movimentações no caixa atual"
                  description="Quando houver vendas, suprimentos ou sangrias, elas aparecerão aqui."
                />
              </div>
            )}
          </div>
        </div>

        <div className={`${softPinkCard} p-5 sm:p-6`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={tinyLabel}>Fechamento</p>
              <h3 className="mt-2 text-[1.7rem] font-semibold tracking-tight text-slate-900">
                Fechamento assistido
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Resumo objetivo para conferência antes de encerrar a operação.
              </p>
            </div>
            <div className="rounded-[18px] border border-rose-100 bg-white p-2.5 text-rose-400 shadow-sm">
              <FileText size={18} />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <CompactStat
              label="Saldo esperado"
              value={formatCurrency(totals.currentDrawerBalance)}
              helper="Valor físico previsto na conferência"
              emphasis
            />
            <CompactStat
              label="Suprimentos lançados"
              value={formatCurrency(totals.supplies)}
              helper="Entradas manuais registradas"
            />
            <CompactStat
              label="Saídas registradas"
              value={formatCurrency(totals.withdrawals)}
              helper="Sangrias e retiradas do período"
            />
            <button
              onClick={() => setShowCloseModal(true)}
              disabled={!isOpen}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[22px] bg-[linear-gradient(180deg,#ffd8da_0%,#ffc8cb_100%)] px-4 py-3.5 text-sm font-semibold text-slate-900 shadow-[0_18px_30px_rgba(255,200,203,0.36)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_34px_rgba(255,200,203,0.44)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Lock size={16} />
              Conferir e fechar caixa
            </button>
          </div>
        </div>
      </section>

      {showHistoryModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[rgba(15,23,42,0.28)] backdrop-blur-sm" onClick={() => setShowHistoryModal(false)} />
          <div className="relative flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] border border-rose-100 bg-white shadow-[0_32px_80px_rgba(15,23,42,0.14)]">
            <div className="flex items-start justify-between border-b border-rose-100 bg-[linear-gradient(180deg,#fff7f8_0%,#ffffff_100%)] px-5 py-4 sm:px-6">
              <div>
                <h3 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-900">
                  <History size={18} className="text-rose-400" />
                  Histórico de movimentações
                </h3>
                <p className="mt-1 text-sm text-slate-500">{filteredMovements.length} registro(s) encontrados.</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-3 border-b border-rose-100 px-5 py-4 md:flex-row md:items-center md:px-6">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="date"
                  className="rounded-2xl border border-rose-100 bg-[#fff8f8] py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-rose-200 focus:bg-white"
                  value={historyFilters.date}
                  onChange={(e) => setHistoryFilters({ ...historyFilters, date: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                {historyFilters.date !== today && (
                  <button
                    onClick={() => setHistoryFilters({ ...historyFilters, date: today })}
                    className="rounded-full border border-rose-200 bg-[#fff4f5] px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-[#ffe8ea]"
                  >
                    Hoje
                  </button>
                )}
                <button
                  onClick={() => setHistoryFilters({ ...historyFilters, date: '' })}
                  className="rounded-full border border-rose-100 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-[#fff8f8]"
                >
                  Todos
                </button>
              </div>

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar por descrição ou tipo..."
                  className="w-full rounded-2xl border border-rose-100 bg-[#fff8f8] py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-rose-200 focus:bg-white"
                  value={historyFilters.search}
                  onChange={(e) => setHistoryFilters({ ...historyFilters, search: e.target.value })}
                />
              </div>

              <div className="relative min-w-[200px]">
                <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <CustomDropdown
                  value={historyFilters.method}
                  onChange={(value) => setHistoryFilters({ ...historyFilters, method: value })}
                  options={[
                    { value: 'Todos', label: 'Todos' },
                    { value: 'Dinheiro', label: 'Dinheiro' },
                    { value: 'Pix', label: 'Pix' },
                    { value: 'Cartão Crédito', label: 'Cartão Crédito' },
                    { value: 'Cartão Débito', label: 'Cartão Débito' },
                  ]}
                  placeholder="Método"
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-[#fffafa]">
              {historyLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-100 border-t-rose-300" />
                </div>
              ) : paginatedMovements.length > 0 ? (
                <div className="divide-y divide-rose-100/80">
                  {paginatedMovements.map((mov) => {
                    const mapped = mapCashMovementForDisplay(mov);
                    const isNegative = mapped.displayType === 'Sangria';
                    const isToday = getLocalDate(mov.createdAt) === today;

                    return (
                      <div
                        key={mov.id}
                        className="flex flex-col gap-3 bg-white px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">{mov.description}</span>
                            {isToday && (
                              <span className="rounded-full bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700">
                                Hoje
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>{mapped.dateStr}</span>
                            <span>•</span>
                            <span>{mapped.timeStr}</span>
                            <span>•</span>
                            <span>{mapped.displayMethod || 'Sem método'}</span>
                            <span>•</span>
                            <span>{mapped.displayType}</span>
                          </div>
                        </div>
                        <div className={`text-right text-sm font-semibold ${isNegative ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {isNegative ? '-' : '+'} {formatCurrency(mapped.amount)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12">
                  <EmptyState title="Nenhum registro encontrado" description="Ajuste os filtros ou selecione outra data." />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-rose-100 bg-white px-5 py-3 sm:px-6">
              <p className="text-xs text-slate-500">
                Página {historyPage} de {totalPages} · {filteredMovements.length} movimentação(ões)
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}
                  disabled={historyPage === 1}
                  className="rounded-xl border border-rose-100 p-2 text-slate-600 transition hover:bg-[#fff8f8] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                  const pageNumber =
                    totalPages <= 5 ? index + 1 : Math.max(1, Math.min(historyPage - 2, totalPages - 4)) + index;

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setHistoryPage(pageNumber)}
                      className={`h-8 w-8 rounded-xl text-xs font-semibold transition ${historyPage === pageNumber
                          ? 'bg-[#ffc8cb] text-slate-900'
                          : 'border border-rose-100 text-slate-600 hover:bg-[#fff8f8]'
                        }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                <button
                  onClick={() => setHistoryPage((page) => Math.min(totalPages, page + 1))}
                  disabled={historyPage === totalPages}
                  className="rounded-xl border border-rose-100 p-2 text-slate-600 transition hover:bg-[#fff8f8] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ModalShell
        open={showOpenModal}
        onClose={() => setShowOpenModal(false)}
        title="Abertura de caixa"
        description="Informe o fundo de troco disponível para iniciar a operação."
        icon={<Unlock className="text-rose-400" size={18} />}
        footer={
          <>
            <button
              onClick={() => setShowOpenModal(false)}
              className="flex-1 rounded-2xl border border-rose-100 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#fff8f8]"
            >
              Cancelar
            </button>
            <button
              onClick={handleOpenRegister}
              className="flex-1 rounded-2xl bg-[linear-gradient(180deg,#ffd8da_0%,#ffc8cb_100%)] py-3 text-sm font-semibold text-slate-900 transition hover:brightness-[0.99]"
            >
              Confirmar abertura
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#fff7f8] p-4">
            <p className="text-xs font-medium text-slate-500">Sugestão com base no fechamento anterior</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(openingFloat || 0)}</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Fundo de troco</label>
            <input
              type="number"
              className="w-full rounded-2xl border border-rose-100 bg-[#fff9fa] p-4 text-2xl font-semibold text-slate-900 outline-none transition focus:border-rose-200 focus:bg-white"
              placeholder="0,00"
              value={openingFloat || ''}
              onChange={(e) => setOpeningFloat(parseFloat(e.target.value))}
              autoFocus
            />
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="Fechamento de caixa"
        description="Confira o dinheiro físico e registre a diferença do fechamento."
        icon={<Lock className="text-rose-400" size={18} />}
        footer={
          <>
            <button
              onClick={() => setShowCloseModal(false)}
              className="flex-1 rounded-2xl border border-rose-100 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#fff8f8]"
            >
              Cancelar
            </button>
            <button
              onClick={handleCloseRegister}
              className="flex-1 rounded-2xl bg-[linear-gradient(180deg,#ffd8da_0%,#ffc8cb_100%)] py-3 text-sm font-semibold text-slate-900 transition hover:brightness-[0.99]"
            >
              Confirmar fechamento
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#fff7f8] p-4">
            <p className="text-xs font-medium text-slate-500">Saldo esperado</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(totals.currentDrawerBalance)}</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Valor contado na gaveta</label>
            <input
              type="number"
              className="w-full rounded-2xl border border-rose-100 bg-[#fff9fa] p-4 text-2xl font-semibold text-slate-900 outline-none transition focus:border-rose-200 focus:bg-white"
              placeholder="0,00"
              value={closingCount || ''}
              onChange={(e) => setClosingCount(parseFloat(e.target.value))}
              autoFocus
            />
          </div>
          {closingCount > 0 && (
            <div className={`rounded-2xl p-4 ${closeDifference === 0 ? 'bg-emerald-50' : 'bg-amber-50'}`}>
              <p className="text-xs font-medium text-slate-500">Diferença apurada</p>
              <p className={`mt-1 text-xl font-semibold ${closeDifference === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {closeDifference > 0 ? '+' : ''}
                {formatCurrency(closeDifference)}
              </p>
            </div>
          )}
        </div>
      </ModalShell>

      <ModalShell
        open={showSangriaModal}
        onClose={() => setShowSangriaModal(false)}
        title="Sangria de caixa"
        description="Registre retiradas para cofre, banco ou outras finalidades."
        icon={<ArrowDownCircle className="text-rose-400" size={18} />}
        footer={
          <>
            <button
              onClick={() => setShowSangriaModal(false)}
              className="flex-1 rounded-2xl border border-rose-100 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#fff8f8]"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveSangria}
              className="flex-1 rounded-2xl bg-[linear-gradient(180deg,#ffd8da_0%,#ffc8cb_100%)] py-3 text-sm font-semibold text-slate-900 transition hover:brightness-[0.99]"
            >
              Confirmar sangria
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#fff7f8] p-4">
            <p className="text-xs font-medium text-slate-500">Saldo disponível</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(totals.currentDrawerBalance)}</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Tipo de retirada</label>
            <CustomDropdown
              value={sangriaForm.type}
              onChange={(value) => setSangriaForm({ ...sangriaForm, type: value })}
              options={[
                { value: 'sangria', label: 'Sangria (cofre / banco)' },
                { value: 'retirada', label: 'Retirada (outros)' },
              ]}
              placeholder="Tipo de retirada"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Valor</label>
            <input
              type="number"
              className="w-full rounded-2xl border border-rose-100 bg-[#fff9fa] p-4 text-2xl font-semibold text-slate-900 outline-none transition focus:border-rose-200 focus:bg-white"
              placeholder="0,00"
              value={sangriaForm.amount}
              onChange={(e) => setSangriaForm({ ...sangriaForm, amount: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Descrição</label>
            <input
              type="text"
              className="w-full rounded-2xl border border-rose-100 bg-[#fff9fa] p-3.5 text-sm text-slate-900 outline-none transition focus:border-rose-200 focus:bg-white"
              placeholder="Ex: depósito bancário"
              value={sangriaForm.description}
              onChange={(e) => setSangriaForm({ ...sangriaForm, description: e.target.value })}
            />
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={showSuprimentoModal}
        onClose={() => setShowSuprimentoModal(false)}
        title="Suprimento de caixa"
        description="Registre entradas manuais de dinheiro para reforço de troco."
        icon={<ArrowUpCircle className="text-rose-400" size={18} />}
        footer={
          <>
            <button
              onClick={() => setShowSuprimentoModal(false)}
              className="flex-1 rounded-2xl border border-rose-100 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:bg-[#fff8f8]"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveSuprimento}
              className="flex-1 rounded-2xl bg-[linear-gradient(180deg,#ffd8da_0%,#ffc8cb_100%)] py-3 text-sm font-semibold text-slate-900 transition hover:brightness-[0.99]"
            >
              Confirmar suprimento
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#fff7f8] p-4">
            <p className="text-xs font-medium text-slate-500">Saldo atual</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(totals.currentDrawerBalance)}</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Valor</label>
            <input
              type="number"
              className="w-full rounded-2xl border border-rose-100 bg-[#fff9fa] p-4 text-2xl font-semibold text-slate-900 outline-none transition focus:border-rose-200 focus:bg-white"
              placeholder="0,00"
              value={suprimentoForm.amount}
              onChange={(e) => setSuprimentoForm({ ...suprimentoForm, amount: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Descrição</label>
            <input
              type="text"
              className="w-full rounded-2xl border border-rose-100 bg-[#fff9fa] p-3.5 text-sm text-slate-900 outline-none transition focus:border-rose-200 focus:bg-white"
              placeholder="Ex: aporte de troco"
              value={suprimentoForm.description}
              onChange={(e) => setSuprimentoForm({ ...suprimentoForm, description: e.target.value })}
            />
          </div>
        </div>
      </ModalShell>
    </div>
  );
};

export default Cash;
