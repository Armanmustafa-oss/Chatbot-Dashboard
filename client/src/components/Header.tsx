import { Bell, User } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function Header({ title, subtitle, children }: HeaderProps) {
  return (
    <div className="page-header">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4">
          {children}
          <button className="rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200">
            <Bell size={20} />
          </button>
          <button className="rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200">
            <User size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
