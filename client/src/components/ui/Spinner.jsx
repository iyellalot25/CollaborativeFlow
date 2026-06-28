// Two variants: inline spinner and full-page loading state.
// Matches DESIGN.md section 5.6 exactly.

// Props:
//   fullPage — boolean (default: false)
//              true   centers spinner in the full viewport
//              false  renders inline (use inside a container)
//   message  — string (optional) — label shown below the spinner
//              only displayed when fullPage is true

const Spinner = ({ fullPage = false, message = "Loading..." }) => {
  // The spinner element itself — same visual for both variants,
  // just different sizes (h-4 w-4 inline vs h-8 w-8 fullpage)
  const InlineSpinner = ({ size = "sm" }) => (
    <div
      className={`
        animate-spin rounded-full
        border-2 border-gray-200 border-t-blue-600
        ${size === "sm" ? "h-4 w-4" : "h-8 w-8"}
      `}
    />
  );

  // Full-page variant — centers in the screen, shows a message
  if (fullPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <InlineSpinner size="lg" />
          <p className="text-sm text-gray-500">{message}</p>
        </div>
      </div>
    );
  }

  // Inline variant — just the spinning circle, no wrapper
  return <InlineSpinner size="sm" />;
};

export default Spinner;
