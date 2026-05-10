import { Link } from "react-router-dom";
import { cn } from "@/utils/cn";
import type { UserUpload } from "@/types/userUpload";

interface UploadedWorksheetCardProps {
  upload: UserUpload;
  categoryName?: string;
}

const levelColors: Record<string, string> = {
  Beginner: "bg-green-100 text-green-800",
  Intermediate: "bg-yellow-100 text-yellow-800",
  Advanced: "bg-red-100 text-red-800",
};

export function UploadedWorksheetCard({
  upload,
  categoryName,
}: UploadedWorksheetCardProps) {
  return (
    <Link
      to={`/my-uploads/${upload.id}`}
      className="block rounded-xl border-2 border-orange-300 bg-white p-5 shadow hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <CustomIcon />
          <h3 className="truncate text-base font-semibold text-gray-900 leading-snug">
            {upload.title}
          </h3>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
            levelColors[upload.level],
          )}
        >
          {upload.level}
        </span>
      </div>

      <div className="mt-2 flex items-start justify-items-start justify-between  gap-2 text-xs text-gray-500">
        <div className="flex items-start gap-1">
          <span className="rounded bg-orange-100 px-2 py-0.5 text-orange-800 font-medium">
            My Upload
          </span>
          {categoryName && (
            <span className="rounded bg-orange-50 px-2 py-0.5 text-orange-700">
              {categoryName}
            </span>
          )}
        </div>

        {upload.schoolGrade && (
          <span className="text-black">Grade {upload.schoolGrade}</span>
        )}
      </div>

      {upload.originalImageDataUrl && (
        <img
          src={upload.originalImageDataUrl}
          alt="Original problem"
          className="mt-3 max-h-24 w-full rounded-lg object-contain bg-gray-50"
        />
      )}
    </Link>
  );
}

function CustomIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-orange-500"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-label="Custom upload"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  );
}
