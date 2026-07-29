import React from 'react';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  className = '',
  disabled = false,
  ...props
}) => {
  const baseStyles = 'px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold-accent disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[#D4AF37] hover:bg-[#F4C542] text-[#111111] shadow-lg shadow-gold-accent/10 hover:shadow-gold-accent/20 active:scale-[0.98]',
    secondary: 'bg-[var(--color-secondary-bg)] hover:bg-[var(--color-hover-bg)] text-[var(--color-text-primary)] border border-[#D4AF37]/20 active:scale-[0.98]',
    outline: 'border border-[#D4AF37]/20 text-[var(--color-text-primary)] hover:bg-[var(--color-hover-bg)] hover:text-[var(--color-text-primary)] active:scale-[0.98]',
    ghost: 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-secondary-bg)]/50 active:scale-[0.98]'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
