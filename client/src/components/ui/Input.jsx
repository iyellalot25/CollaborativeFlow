// Covers text inputs, textareas, and the label+error form group pattern.
// All focus ring and border rules follow DESIGN.md section 5.2 exactly.

// Props:
//   label       — string (optional) — renders a label above the input
//   error       — string (optional) — renders red error text below
//   multiline   — boolean — renders a <textarea> instead of <input>
//   rows        — number (default: 3) — only used when multiline is true
//   All standard input props (type, placeholder, value, onChange, disabled...)
//   are passed through via ...props (spread operator)

const Input = ({
  label,
  error,
  multiline = false,
  rows = 3,
  className = "",
  ...props // everything else: type, placeholder, value, onChange, name, id...
}) => {
  // Shared classes for both <input> and <textarea>
  const inputClasses = `
    w-full px-3 py-2 text-sm text-gray-900 bg-white
    border border-gray-200 rounded-lg
    placeholder:text-gray-400
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    transition-shadow
    disabled:opacity-50 disabled:cursor-not-allowed
    ${error ? "border-red-400 focus:ring-red-400" : ""}
    ${className}
  `.trim();

  return (
    <div className="flex flex-col gap-1">
      {/* Label — only rendered if the label prop is provided */}
      {label && (
        <label className="text-xs font-medium text-gray-700">{label}</label>
      )}

      {/* Conditionally render textarea or input */}
      {multiline ? (
        <textarea
          rows={rows}
          className={`${inputClasses} resize-none`}
          {...props}
        />
      ) : (
        <input className={inputClasses} {...props} />
      )}

      {/* Error message — only rendered if the error prop is provided */}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};

export default Input;
