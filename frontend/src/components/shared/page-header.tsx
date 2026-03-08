import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl font-medium">
          {description}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {children}
      </div>
    </div>
  );
}