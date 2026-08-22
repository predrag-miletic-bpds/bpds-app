import React from 'react';
import styles from './ui.module.css';

/** Page wrapper with a max width and consistent padding. */
export function Page({ children }: { children: React.ReactNode }) {
  return <div className={styles.page}>{children}</div>;
}

/** Page header with a title, optional subtitle and right-aligned actions. */
export function PageHead({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className={styles.pageHead}>
      <div>
        <h1 className={styles.pageTitle}>{title}</h1>
        {sub ? <p className={styles.pageSub}>{sub}</p> : null}
      </div>
      {actions ? <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{actions}</div> : null}
    </div>
  );
}

/** Surface card container. */
export function Card({ children, className = '', pad = true, style }: { children: React.ReactNode; className?: string; pad?: boolean; style?: React.CSSProperties }) {
  return <div style={style} className={`${styles.card} ${pad ? styles.cardPad : ''} ${className}`}>{children}</div>;
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  full?: boolean;
};

/** Standard BPDS button. */
export function Button({ variant = 'ghost', size = 'md', full, className = '', ...rest }: BtnProps) {
  const sizeClass = size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : '';
  return (
    <button
      type="button"
      {...rest}
      className={`${styles.btn} ${styles[variant]} ${sizeClass} ${full ? styles.full : ''} ${className}`}
    />
  );
}

/** Small status pill. */
export function Badge({ tone = 'gray', children }: { tone?: 'gray' | 'orange' | 'green' | 'blue' | 'amber' | 'dark'; children: React.ReactNode }) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}

/** Labelled form field wrapper. */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {children}
    </label>
  );
}

/** Styled select input. */
export function Select({ children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...rest} className={styles.select}>{children}</select>;
}

/** Styled text input. */
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={styles.input} />;
}

/** Styled textarea. */
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={styles.textarea} />;
}

/** Toggleable chip used for multi-select filters. */
export function Chip({ on, children, onClick, accentSelected = false }: { on?: boolean; children: React.ReactNode; onClick?: () => void; accentSelected?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`${styles.chip} ${on ? styles.chipOn : ''} ${on && accentSelected ? styles.chipAccentOn : ''}`}>
      {children}
    </button>
  );
}

/** Horizontal wrapping row of chips. */
export function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className={styles.chipRow}>{children}</div>;
}

/** Uppercase section label. */
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className={styles.sectionTitle}>{children}</div>;
}

/** Empty-state message. */
export function Empty({ children }: { children: React.ReactNode }) {
  return <div className={styles.empty}>{children}</div>;
}

/** Circular initials avatar. */
export function Avatar({ name, color, size = 40 }: { name: string; color: string; size?: number }) {
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('');
  return (
    <div className={styles.avatar} style={{ background: color, width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

/** Map a BPDS skill level number to its display tone and label. */
export function levelInfo(level: number): { tone: 'green' | 'blue' | 'orange'; label: string } {
  if (level === 1) return { tone: 'green', label: 'L1 Foundation' };
  if (level === 2) return { tone: 'blue', label: 'L2 Development' };
  return { tone: 'orange', label: 'L3 Performance' };
}
