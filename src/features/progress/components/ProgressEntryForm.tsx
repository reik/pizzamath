import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { progressSchema, type ProgressInput } from "@/api/progress";
import { useProgressMutation } from "../hooks/useProgress";
import { cn } from "@/utils/cn";

interface ProgressEntryFormProps {
  worksheetId: string;
  worksheetTitle: string;
  userId: string;
}

export function ProgressEntryForm({
  worksheetId,
  worksheetTitle,
  userId,
}: ProgressEntryFormProps) {
  const mutation = useProgressMutation(userId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProgressInput>({
    resolver: zodResolver(progressSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      score: 0,
      comment: "",
    },
  });

  function onSubmit(data: ProgressInput) {
    mutation.mutate(
      { userId, worksheetId, worksheetTitle, ...data },
      { onSuccess: () => reset() },
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="date"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Date
          </label>
          <input
            id="date"
            type="date"
            {...register("date")}
            className={cn(
              "w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500",
              errors.date ? "border-red-500" : "border-gray-300",
            )}
          />
          {errors.date && (
            <p className="text-xs text-red-600 mt-0.5">{errors.date.message}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="score"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Score (0–100)
          </label>
          <input
            id="score"
            type="number"
            {...register("score")}
            className={cn(
              "w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500",
              errors.score ? "border-red-500" : "border-gray-300",
            )}
          />
          {errors.score && (
            <p className="text-xs text-red-600 mt-0.5">
              {errors.score.message}
            </p>
          )}
        </div>
      </div>
      <div>
        <label
          htmlFor="comment"
          className="block text-xs font-medium text-gray-700 mb-1"
        >
          Comment
        </label>
        <textarea
          id="comment"
          rows={2}
          {...register("comment")}
          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={mutation.isPending}
        className="rounded-md bg-orange-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
      >
        {mutation.isPending ? "Saving…" : "Save Log"}
      </button>
      {mutation.isSuccess && (
        <p className="text-xs text-green-600">Attempt saved!</p>
      )}
    </form>
  );
}
