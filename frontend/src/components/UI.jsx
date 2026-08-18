export function Spinner({ className = "" }) {
  return (
    <span
      className={`inline-block w-4 h-4 rounded-full border-2 border-cream/25 border-t-brass animate-spin mr-2 align-middle ${className}`}
    />
  );
}

export function LoaderDots() {
  return (
    <span className="inline-flex gap-1 items-center justify-center">
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-dotPulse" />
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-dotPulse [animation-delay:.15s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-dotPulse [animation-delay:.3s]" />
    </span>
  );
}

export function Toast({ message }) {
  return (
    <div
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 bg-brass text-ink px-4 py-2 rounded-full
                  font-mono text-xs font-semibold max-w-[80%] text-center z-50 pointer-events-none
                  transition-opacity duration-300 ${message ? "opacity-100" : "opacity-0"}`}
    >
      {message}
    </div>
  );
}
