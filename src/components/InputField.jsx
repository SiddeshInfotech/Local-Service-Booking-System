import React from 'react';

const InputField = ({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon: Icon,
  rightElement,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`flex flex-col w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-gray-300 font-medium text-sm sm:text-base">
          {label} {required && <span className="text-blue-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center mt-2 w-full">
        {Icon && (
          <div className="absolute left-4 text-zinc-500 pointer-events-none flex items-center justify-center">
            <Icon size={18} />
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className={`w-full p-3 bg-[#262626] border border-gray-700 rounded-xl text-white placeholder-zinc-500 outline-none transition duration-300 focus:border-blue-500 ${
            Icon ? 'pl-11' : 'px-4'
          } ${rightElement ? 'pr-12' : 'pr-4'}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 flex items-center justify-center">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
};

export default InputField;
