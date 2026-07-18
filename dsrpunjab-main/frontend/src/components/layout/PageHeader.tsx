import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  backLink?: string;
};

export default function PageHeader({
  title,
  description,
  action,
  backLink,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex items-start gap-3">
        {backLink && (
          <Link
            to={backLink}
            className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
            title="Go back"
          >
            <ArrowLeft size={18} />
          </Link>
        )}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-sm text-slate-500 md:text-base">
              {description}
            </p>
          )}
        </div>
      </div>

      {action}
    </div>
  );
}