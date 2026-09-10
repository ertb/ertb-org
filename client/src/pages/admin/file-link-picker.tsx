import { KeyboardEvent, useMemo, useState } from "react";
import { FileRejection } from "react-dropzone";
import { Upload } from "lucide-react";
import { FilesResponse, FilesEntry } from "@/lib/api-schema";
import { fileTags, getFilename } from "@/lib/files";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileDropZone } from "@/components/file-drop-zone/file-drop-zone";
import { uploadFile } from "@/components/file-drop-zone/upload-file";
import { useUserProfile } from "@/contexts/user-login-context";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const MAX_RESULTS = 10;

interface Props {
  data?: FilesResponse;
  loading?: boolean;
  selectedUrl?: string;
  onSelect: (file: FilesEntry) => void;
  onUploaded?: () => void;
  inputRef?: (el: HTMLInputElement | null) => void;
}
export const FileLinkPicker = ({ data, loading, selectedUrl, onSelect, onUploaded, inputRef }: Props) => {
  // if selectedUrl already matches a known file (eg. reopening the dialog on an existing
  // file link), show its name right away instead of starting the search blank
  const [search, setSearch] = useState(() => {
    const match = data?.files.find((f) => f.url === selectedUrl);
    return match ? getFilename(match) : "";
  });
  const [open, setOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const { profile } = useUserProfile();
  const { toast } = useToast();

  const allMatches = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.files || []).filter((file) => !term || getFilename(file).toLowerCase().includes(term));
  }, [data, search]);
  const matches = allMatches.slice(0, MAX_RESULTS);
  const moreCount = allMatches.length - matches.length;

  const selectFile = (file: FilesEntry) => {
    onSelect(file);
    setSearch(getFilename(file));
    setOpen(false);
  };

  const onSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") setOpen(false);
    if (e.key === "Enter" && matches.length > 0) {
      e.preventDefault();
      selectFile(matches[0]);
    }
  };

  const onDrop = (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    acceptedFiles.forEach((f) =>
      uploadFile<FilesEntry>(f, profile?.authorization)
        .then((file) => {
          toast.success("File uploaded", f.name);
          selectFile(file);
          onUploaded?.();
          setUploadOpen(false);
        })
        .catch((e) => {
          toast.error("Upload failed", f.name);
          console.error("Upload failed", e);
        })
    );
    fileRejections.forEach((r) => toast.warn("File rejected", r.file.name));
  };

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Input
          ref={inputRef}
          placeholder="Search files…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onSearchKeyDown}
        />
        {open && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-md border border-input bg-background shadow-md">
            {loading && <div className="p-3 text-sm text-gray-500">Loading…</div>}
            {!loading && matches.length === 0 && <div className="p-3 text-sm text-gray-500">No files found.</div>}
            {matches.map((file) => (
              <button
                type="button"
                key={file._id}
                // keep the search input focused so the click registers before blur closes the list
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectFile(file)}
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
            {moreCount > 0 && (
              <div className="px-3 py-2 text-xs text-gray-400">
                +{moreCount} more — keep typing to narrow the results
              </div>
            )}
          </div>
        )}
      </div>
      <Button type="button" variant="outline" onClick={() => setUploadOpen(true)}>
        <Upload className="mr-2 h-4 w-4" />
        Upload
      </Button>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload a file</DialogTitle>
            <DialogDescription>The uploaded file will be selected as the link automatically.</DialogDescription>
          </DialogHeader>
          <FileDropZone onDrop={onDrop} />
        </DialogContent>
      </Dialog>
    </div>
  );
};
