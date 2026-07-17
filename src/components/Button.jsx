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
    secondary: 'bg-[#1A1D23] hover:bg-[#232831] text-[#FFFFFF] border border-[#D4AF37]/20 active:scale-[0.98]',
    outline: 'border border-[#D4AF37]/20 text-zinc-300 hover:bg-[#232831] hover:text-white active:scale-[0.98]',
    ghost: 'text-zinc-400 hover:text-white hover:bg-zinc-900/50 active:scale-[0.98]'
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
