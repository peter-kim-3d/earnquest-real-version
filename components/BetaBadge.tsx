interface BetaBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function BetaBadge({ className = '', size = 'md' }: BetaBadgeProps) {
  const showBeta = process.env.NEXT_PUBLIC_SHOW_BETA === 'true';

  if (!showBeta) return null;

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-0.5 text-xs',
    lg: 'px-2.5 py-1 text-sm',
  };

  return (
    <span className={`inline-flex items-center rounded-md font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-black shadow-sm ${sizeClasses[size]} ${className}`}>
      BETA
    </span>
  );
}
