"use client";

type Props = {
  open: boolean;
  onClick: () => void;
  className?: string;
};

export default function HamburgerButton({ open, onClick, className = "" }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Toggle menu"
      aria-expanded={open}
      className={`flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors ${className}`}
    >
      <div className="relative w-6 h-6">
        <span
          className={`absolute left-0 top-1/2 h-[2px] w-6 bg-gray-700 rounded-full transition-all duration-300 origin-center ${
            open ? "rotate-45" : "-translate-y-2"
          }`}
        />
        <span
          className={`absolute left-0 top-1/2 h-[2px] w-6 bg-gray-700 rounded-full transition-all duration-300 ${
            open ? "opacity-0 scale-x-0" : ""
          }`}
        />
        <span
          className={`absolute left-0 top-1/2 h-[2px] w-6 bg-gray-700 rounded-full transition-all duration-300 origin-center ${
            open ? "-rotate-45" : "translate-y-2"
          }`}
        />
      </div>
    </button>
  );
}
