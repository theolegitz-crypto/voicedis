import * as React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'ghost' | 'danger';
}

export function Button({
  className,
  variant = 'default',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
        variant === 'secondary' && 'bg-accent text-accent-foreground hover:bg-accent/85',
        variant === 'ghost' && 'bg-transparent text-foreground hover:bg-accent/70',
        variant === 'danger' && 'bg-danger text-white hover:bg-danger/90',
        className,
      )}
      {...props}
    />
  );
}

