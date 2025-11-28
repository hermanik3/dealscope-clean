"use client";

import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
};

export function Button({ className = "", children, ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors";
  return (
    <button className={`${base} ${className}`} {...props}>
      {children}
    </button>
  );
}
