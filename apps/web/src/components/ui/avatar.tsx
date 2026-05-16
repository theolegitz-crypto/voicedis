import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt: string;
  fallback: string;
  className?: string;
}

export function Avatar({ src, alt, fallback, className }: AvatarProps) {
  return (
    <div
      className={cn(
        'relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-accent text-sm font-semibold text-accent-foreground',
        className,
      )}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span>{getInitials(fallback)}</span>
      )}
    </div>
  );
}
