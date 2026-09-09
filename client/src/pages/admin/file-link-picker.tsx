import { useMemo, useState } from "react";
import { useGet } from "@/lib/rest-client/use-get";
import { FilesResponse, FilesEntry } from "@/lib/api-schema";
import { fileTags, getFilename } from "@/lib/files";
import { Input } from "@/components/ui/input";
import { OptionSelect } from "@/components/option-select";
import { cn } from "@/lib/utils";

const categoryOptions = [
  { value: "all", label: "All categories" },
  ...fileTags,
  { value: "none", label: "No category" },
];

interface Props {
  selectedUrl?: string;
  onSelect: (file: FilesEntry) => void;
}
export const FileLinkPicker = ({ selectedUrl, onSelect }: Props) => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const { data, loading } = useGet<FilesResponse>("/api/v1/files?limit=0");

  const files = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.files || []).filter((file) => {
      if (category === "none" ? !!file.tag : category !== "all" && file.tag !== category) return false;
      if (term && !getFilename(file).toLowerCase().includes(term)) return false;
      return true;
    });
  }, [data, search, category]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          placeholder="Search files…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <OptionSelect className="w-40" value={category} options={categoryOptions} onValueChange={setCategory} />
      </div>
      <div className="max-h-48 overflow-y-auto rounded-md border border-input">
        {loading && <div className="p-3 text-sm text-gray-500">Loading…</div>}
        {!loading && files.length === 0 && <div className="p-3 text-sm text-gray-500">No files found.</div>}
        {files.map((file) => (
          <button
            type="button"
            key={file._id}
            onClick={() => onSelect(file)}
            className={cn(
              "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent [&:not(:last-child)]:border-b border-gray-200",
              selectedUrl === file.url && "bg-accent"
            )}
          >
            <span className="truncate">{getFilename(file)}</span>
            {file.tag && (
              <span className="shrink-0 text-xs text-gray-400">
                {fileTags.find((t) => t.value === file.tag)?.label || file.tag}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
