import React from 'react';

const PasswordStrengthIndicator = ({ password }) => {
  const evaluateStrength = (pass) => {
    if (!pass) return null;
    
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) {
      return { level: 1, label: '🔴 Weak Password', color: 'bg-red-500', text: 'text-red-500' };
    }
    if (score === 3) {
      return { level: 2, label: '🟠 Fair Password', color: 'bg-orange-500', text: 'text-orange-500' };
    }
    if (score === 4) {
      return { level: 3, label: '🟡 Good Password', color: 'bg-yellow-400', text: 'text-yellow-400' };
    }
    return { level: 4, label: '🟢 Strong Password', color: 'bg-green-500', text: 'text-green-500' };
  };

  const strength = evaluateStrength(password);
  
  if (!strength) return null;

  return (
    <div className="flex flex-col gap-1.5 mt-1 mb-2">
      <div className="flex text-xs font-medium">
        <span className={strength.text}>{strength.label}</span>
      </div>
      <div className="flex gap-1 h-1.5 w-full rounded-full overflow-hidden">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`flex-1 rounded-full transition-colors duration-300 ${
              step <= strength.level ? strength.color : 'bg-zinc-700/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
