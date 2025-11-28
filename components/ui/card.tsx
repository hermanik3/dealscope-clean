import React from "react";

type CardProps = {
  className?: string;
  children: React.ReactNode;
};

export function Card({ className = "", children }: CardProps) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

type CardHeaderProps = {
  children: React.ReactNode;
};

export function CardHeader({ children }: CardHeaderProps) {
  return <div className="px-5 pt-4 pb-2 border-b border-slate-100">{children}</div>;
}

type CardTitleProps = {
  children: React.ReactNode;
};

export function CardTitle({ children }: CardTitleProps) {
  return <h3 className="text-sm font-semibold text-slate-900">{children}</h3>;
}

type CardContentProps = {
  className?: string;
  children: React.ReactNode;
};

export function CardContent({ className = "", children }: CardContentProps) {
  return <div className={`px-5 pb-4 pt-3 ${className}`}>{children}</div>;
}
