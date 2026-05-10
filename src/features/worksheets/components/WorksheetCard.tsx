import { Link } from "react-router-dom";
import type { Worksheet } from "@/types/worksheet";
import { cn } from "@/utils/cn";
import { slugify } from "@/utils/slugify";

interface WorksheetCardProps {
  worksheet: Worksheet;
  categoryName?: string;
  subcategoryName?: string;
}

const levelColors: Record<string, string> = {
  Beginner: "bg-green-100 text-green-800",
  Intermediate: "bg-yellow-100 text-yellow-800",
  Advanced: "bg-red-100 text-red-800",
};

export function WorksheetCard({
  worksheet,
  categoryName,
  subcategoryName,
}: WorksheetCardProps) {
  const catSlug = slugify(categoryName ?? worksheet.categoryId);
  const subSlug = slugify(subcategoryName ?? worksheet.subcategoryId);

  return (
    <Link
      to={`/worksheets/${catSlug}/${subSlug}/${worksheet.id}`}
      className="block rounded-xl border-2 border-gray-300 bg-white p-5 shadow hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-900 leading-snug">
          {worksheet.title}
        </h3>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
            levelColors[worksheet.level],
          )}
        >
          {worksheet.level}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
        {categoryName && (
          <span className="rounded bg-orange-50 px-2 py-0.5 text-orange-700">
            {categoryName}
          </span>
        )}
        {subcategoryName && (
          <span className="rounded bg-blue-50 px-2 py-0.5 text-blue-700">
            {subcategoryName}
          </span>
        )}
        {worksheet.schoolGrade && <span>Grade {worksheet.schoolGrade}</span>}
        <span>by {worksheet.author}</span>
      </div>
    </Link>
  );
}
