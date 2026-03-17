import React from 'react';

// ============================================================
// Design System Core Components
// Based on Antigravity SaaS Design System Reference
// ============================================================

// ─── BADGE ──────────────────────────────────────────────────

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'outline' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
    size?: 'sm' | 'md' | 'lg';
}

const badgeVariants = {
    default: { bg: '#3F3F46', color: '#FFFFFF', border: 'none' },
    outline: { bg: 'transparent', color: '#FFFFFF', border: '1px solid #3F3F46' },
    secondary: { bg: 'rgba(255,255,255,0.05)', color: '#A1A1AA', border: 'none' },
    success: { bg: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' },
    warning: { bg: 'rgba(249,115,22,0.1)', color: '#ea580c', border: '1px solid rgba(249,115,22,0.2)' },
    error: { bg: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' },
    info: { bg: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' },
};

const badgeSizes = {
    sm: { padding: '0.125rem 0.625rem', fontSize: '0.75rem' },
    md: { padding: '0.25rem 0.75rem', fontSize: '0.875rem' },
    lg: { padding: '0.375rem 1rem', fontSize: '1rem' },
};

export function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
    const v = badgeVariants[variant];
    const s = badgeSizes[size];
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '9999px', fontWeight: 600, textTransform: 'capitalize',
            background: v.bg, color: v.color, border: v.border || 'none',
            padding: s.padding, fontSize: s.fontSize,
        }}>{children}</span>
    );
}

// ─── STATUS BADGE ───────────────────────────────────────────

interface StatusBadgeProps {
    label: string;
    variant?: 'low' | 'medium' | 'high' | 'critical' | 'success' | 'warning' | 'error' | 'info';
    showDot?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const statusVariants = {
    low: { dot: '#3B82F6', text: '#60A5FA', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
    medium: { dot: '#EAB308', text: '#FDE047', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.2)' },
    high: { dot: '#F97316', text: '#FB923C', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)' },
    critical: { dot: '#EF4444', text: '#F87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
    success: { dot: '#4ADE80', text: '#4ADE80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.2)' },
    warning: { dot: '#FDE047', text: '#FDE047', bg: 'rgba(253,224,71,0.1)', border: 'rgba(253,224,71,0.2)' },
    error: { dot: '#F87171', text: '#F87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' },
    info: { dot: '#60A5FA', text: '#60A5FA', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)' },
};

const statusSizes = {
    sm: { padding: '0.125rem 0.5rem', fontSize: '0.75rem' },
    md: { padding: '0.25rem 0.75rem', fontSize: '0.875rem' },
    lg: { padding: '0.375rem 1rem', fontSize: '1rem' },
};

export function StatusBadge({ label, variant = 'low', showDot = false, size = 'md' }: StatusBadgeProps) {
    const v = statusVariants[variant];
    const s = statusSizes[size];
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', borderRadius: '9999px',
            fontWeight: 500, textTransform: 'capitalize',
            background: v.bg, color: v.text, border: `1px solid ${v.border}`,
            padding: s.padding, fontSize: s.fontSize,
        }}>
            {showDot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: v.dot, marginRight: '0.375rem', flexShrink: 0 }} />}
            {label}
        </span>
    );
}

// ─── SHINE BADGE ────────────────────────────────────────────

interface ShineBadgeProps {
    children: React.ReactNode;
    variant?: 'new' | 'featured' | 'premium';
    delay?: 1 | 2 | 3;
}

const shineVariants = {
    new: {
        background: 'linear-gradient(180deg, #FFFFFF 0%, #D4D4D8 100%)',
        color: '#121214', border: 'none',
        boxShadow: '0 0 8px rgba(255,255,255,0.15)',
    },
    featured: {
        background: '#18181B', color: '#F4F4F5',
        border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'none',
    },
    premium: {
        background: 'linear-gradient(180deg, #3F3F46 0%, #18181B 100%)',
        color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.12)', boxShadow: 'none',
    },
};

export function ShineBadge({ children, variant = 'new', delay = 1 }: ShineBadgeProps) {
    const v = shineVariants[variant];
    return (
        <span className={`shine-loop shine-d${delay}`} style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: '0.375rem 1rem', borderRadius: '9999px',
            fontSize: '0.875rem', fontWeight: 500,
            background: v.background, color: v.color,
            border: v.border, boxShadow: v.boxShadow,
        }}>
            {children}
        </span>
    );
}

// ─── BUTTON ─────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'primary';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    loading?: boolean;
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
}

const btnVariants: Record<string, { bg: string; color: string; border: string; hoverBg: string }> = {
    default: { bg: '#E4E4E7', color: '#18181B', border: 'none', hoverBg: '#D4D4D8' },
    primary: { bg: 'rgb(var(--primary))', color: '#FFFFFF', border: 'none', hoverBg: 'rgb(var(--primary-700))' },
    destructive: { bg: '#F87171', color: '#121214', border: 'none', hoverBg: '#EF4444' },
    outline: { bg: 'transparent', color: '#FFFFFF', border: '1px solid #27272A', hoverBg: '#27272A' },
    secondary: { bg: '#3F3F46', color: '#F4F4F5', border: 'none', hoverBg: '#52525B' },
    ghost: { bg: 'transparent', color: '#E4E4E7', border: 'none', hoverBg: '#27272A' },
    link: { bg: 'transparent', color: '#E4E4E7', border: 'none', hoverBg: 'transparent' },
};

const btnSizes = {
    sm: { padding: '0.375rem 0.875rem', fontSize: '0.75rem' },
    md: { padding: '0.5rem 1rem', fontSize: '0.875rem' },
    lg: { padding: '0.75rem 1.5rem', fontSize: '1rem' },
    xl: { padding: '1rem 2rem', fontSize: '1.125rem' },
};

export const DSButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ children, variant = 'default', size = 'md', loading, disabled, startIcon, endIcon, className, style, ...props }, ref) => {
        const v = btnVariants[variant] || btnVariants.default;
        const s = variant === 'link' ? { padding: '0', fontSize: '0.875rem' } : btnSizes[size];
        const isDisabled = disabled || loading;
        return (
            <button
                ref={ref}
                disabled={isDisabled}
                className={className}
                onMouseEnter={(e) => { if (!isDisabled) { (e.currentTarget as HTMLButtonElement).style.background = v.hoverBg; if (variant === 'link') (e.currentTarget as HTMLButtonElement).style.textDecoration = 'underline'; } }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = v.bg; if (variant === 'link') (e.currentTarget as HTMLButtonElement).style.textDecoration = 'none'; }}
                style={{
                    background: v.bg, color: v.color, border: v.border || 'none',
                    padding: s.padding, fontSize: s.fontSize,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    gap: '0.5rem', borderRadius: variant === 'link' ? '0' : '9999px', fontWeight: 500,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    opacity: isDisabled ? 0.5 : 1,
                    transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease',
                    pointerEvents: isDisabled ? 'none' : 'auto',
                    textDecoration: 'none',
                    ...style,
                }}
                {...props}
            >
                {loading && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                )}
                {!loading && startIcon}
                {children}
                {endIcon}
            </button>
        );
    }
);
DSButton.displayName = 'DSButton';

// ─── ICON BUTTON ────────────────────────────────────────────

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'destructive' | 'ghost' | 'secondary';
    size?: 'sm' | 'md' | 'lg';
}

const iconBtnVariants: Record<string, { bg: string; color: string; border: string }> = {
    default: { bg: '#E4E4E7', color: '#18181B', border: 'none' },
    outline: { bg: 'transparent', color: '#E4E4E7', border: '1px solid #27272A' },
    destructive: { bg: '#F87171', color: '#121214', border: 'none' },
    ghost: { bg: 'transparent', color: '#A1A1AA', border: 'none' },
    secondary: { bg: '#3F3F46', color: '#F4F4F5', border: 'none' },
};

const iconBtnSizes = {
    sm: { width: 32, height: 32 },
    md: { width: 40, height: 40 },
    lg: { width: 48, height: 48 },
};

export function DSIconButton({ children, variant = 'ghost', size = 'md', style, ...props }: IconButtonProps) {
    const v = iconBtnVariants[variant] || iconBtnVariants.ghost;
    const s = iconBtnSizes[size];
    return (
        <button
            style={{
                background: v.bg, color: v.color, border: v.border || 'none',
                width: s.width, height: s.height, borderRadius: '50%',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0,
                ...style,
            }}
            {...props}
        >{children}</button>
    );
}
