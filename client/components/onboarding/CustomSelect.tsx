"use client";

import { useState, useRef, useEffect } from "react";

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  isLoading = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b79ff] focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
      >
        <span className={selectedOption ? "text-gray-900" : "text-gray-500"}>
          {isLoading ? "Loading..." : selectedOption?.label || placeholder}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {isOpen && !disabled && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
          <div className="max-h-60 overflow-y-auto">
            {options.length > 0 ? (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-blue-50 ${
                    value === option.value
                      ? "bg-blue-50 text-[#0b79ff] font-medium"
                      : "text-gray-700 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {value === option.value && (
                      <svg className="w-4 h-4 text-[#0b79ff]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span>{option.label}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">No options available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
