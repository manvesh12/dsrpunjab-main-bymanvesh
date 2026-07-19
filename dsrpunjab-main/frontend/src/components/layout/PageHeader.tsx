import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
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
    <div className="gov-page-header mb-6 flex flex-col justify-between gap-4 border-b-2 border-[#12396b] bg-white px-5 py-4 sm:flex-row sm:items-center dark:bg-slate-900">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {backLink && (
          <Link
            to={backLink}
            className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-slate-300 bg-white text-[#12396b] transition hover:bg-blue-50"
            title="Go back"
          >
            <ArrowLeft size={18} />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-extrabold text-[#12396b] dark:text-white md:text-[28px]">
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
