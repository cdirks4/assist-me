"use client";

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

export function Tooltip({ text, children }: TooltipProps) {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute z-10 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm dark:bg-gray-700 -translate-y-10 left-1/2 -translate-x-1/2">
        {text}
      </div>
    </div>
  );
}