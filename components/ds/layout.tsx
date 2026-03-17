import React from 'react';

// ─── SECTION HEADER ─────────────────────────────────────────
// DS Reference sec 14.1: Uppercase accent color separator

interface SectionHeaderProps {
    title: string;
    accentColor?: string;
    action?: React.ReactNode;
}

export function SectionHeader({ title, accentColor = 'rgb(var(--primary))', action }: SectionHeaderProps) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingBottom: '0.75rem', marginBottom: '1rem',
            borderBottom: '1px solid #27272A',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 3, height: 16, borderRadius: 2, background: accentColor }} />
                <h3 style={{
                    fontSize: '0.75rem', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    color: '#A1A1AA',
                }}>{title}</h3>
            </div>
            {action}
        </div>
    );
}

// ─── EMPTY STATE ────────────────────────────────────────────
// DS Reference sec 9.3

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '3rem 1.5rem', textAlign: 'center',
        }}>
            {icon && (
                <div style={{ marginBottom: '1rem', opacity: 0.3, color: '#A1A1AA' }}>
                    {icon}
                </div>
            )}
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#E4E4E7', marginBottom: '0.25rem' }}>
                {title}
            </h4>
            {description && (
                <p style={{ fontSize: '0.875rem', color: '#71717A', maxWidth: '20rem' }}>
                    {description}
                </p>
            )}
            {action && <div style={{ marginTop: '1rem' }}>{action}</div>}
        </div>
    );
}

// ─── NOTICE ─────────────────────────────────────────────────
// DS Reference sec 9.1

interface NoticeProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    variant?: 'info' | 'warning' | 'error' | 'success';
}

const noticeColors = {
    info: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', icon: '#60A5FA', text: '#93C5FD' },
    warning: { bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.2)', icon: '#FBBF24', text: '#FDE68A' },
    error: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', icon: '#F87171', text: '#FCA5A5' },
    success: { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', icon: '#4ADE80', text: '#86EFAC' },
};

export function Notice({ icon, title, description, variant = 'info' }: NoticeProps) {
    const c = noticeColors[variant];
    return (
        <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
            padding: '1rem', borderRadius: '0.75rem',
            background: c.bg, border: `1px solid ${c.border}`,
        }}>
            {icon && <div style={{ color: c.icon, flexShrink: 0, marginTop: 2 }}>{icon}</div>}
            <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: c.text }}>{title}</p>
                {description && <p style={{ fontSize: '0.75rem', color: '#A1A1AA', marginTop: '0.25rem' }}>{description}</p>}
            </div>
        </div>
    );
}

// ─── PROGRESS CARD ──────────────────────────────────────────
// DS Reference sec 9.4

interface ProgressCardProps {
    icon: React.ReactNode;
    label: string;
    value: number;
    max: number;
    color?: string;
    suffix?: string;
}

export function ProgressCard({ icon, label, value, max, color = 'rgb(var(--primary))', suffix = '' }: ProgressCardProps) {
    const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    return (
        <div style={{
            background: '#18181B', borderRadius: '0.75rem', border: '1px solid #27272A',
            padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
            <div style={{
                width: 52, height: 52, borderRadius: '0.75rem',
                background: '#27272A', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: color, flexShrink: 0,
            }}>
                {icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.75rem', color: '#A1A1AA', fontWeight: 500 }}>{label}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#F4F4F5' }}>
                        {value.toLocaleString('pt-BR')}{suffix} / {max.toLocaleString('pt-BR')}{suffix}
                    </span>
                </div>
                <div style={{ width: '100%', height: 12, background: '#27272A', borderRadius: 9999, overflow: 'hidden' }}>
                    <div style={{
                        height: '100%', borderRadius: 9999, background: color,
                        width: `${percent}%`, transition: 'width 0.6s ease',
                    }} />
                </div>
            </div>
        </div>
    );
}
