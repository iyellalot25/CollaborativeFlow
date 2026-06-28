// Reusable button component

// Props:
//   variant  — "primary" | "secondary" | "ghost" | "danger" | "icon"
//   size     — "sm" | "md" (default: "md")
//   disabled — boolean
//   onClick  — function
//   type     — "button" | "submit" | "reset" (default: "button")
//   children — button label or icon content
//   className — optional extra classes

const Button = ({
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  type = "button",
  children,
  className = "",
}) => {
  // Base classes shared by all button variants
  // transition-colors, disabled states
  const base =
    "inline-flex items-center justify-center font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  // Variant-specific classes
  const variants = {
    primary:
      "bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800",
    secondary:
      "bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 active:bg-gray-100",
    ghost: "text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700",
    danger:
      "bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800",
    // Icon buttons are square with icon-only content — no text label
    icon: "text-gray-400 rounded-lg hover:bg-gray-100 hover:text-gray-600",
  };

  // Size-specific padding — icon variant uses square padding
  const sizes = {
    sm: variant === "icon" ? "p-1" : "px-3 py-1.5 text-xs",
    md: variant === "icon" ? "p-2" : "px-4 py-2 text-sm",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
