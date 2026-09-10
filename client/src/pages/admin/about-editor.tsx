import { KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { useBlocker } from "react-router-dom";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Editor } from "@tiptap/core";
import { Markdown, MarkdownStorage } from "tiptap-markdown";

/** tiptap-markdown doesn't augment @tiptap/core's Storage type with its own storage shape */
const getMarkdown = (editor: Editor) =>
  (editor.storage as unknown as { markdown: MarkdownStorage }).markdown.getMarkdown();
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Undo2,
  Unlink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileLinkPicker } from "./file-link-picker";
import { FilesResponse, FilesEntry } from "@/lib/api-schema";
import { getFilename } from "@/lib/files";
import { useGet } from "@/lib/rest-client/use-get";
import { cn } from "@/lib/utils";

interface ToolbarButtonProps {
  label: string;
  title?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}
const ToolbarButton = ({
  label,
  title,
  active,
  disabled,
  onClick,
  children,
}: ToolbarButtonProps) => (
  <Button
    type="button"
    variant="ghost"
    size="icon"
    className={cn(active && "bg-accent text-accent-foreground")}
    aria-label={label}
    aria-pressed={active}
    title={title ?? label}
    disabled={disabled}
    // keep the editor's selection/focus intact when clicking a toolbar button
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
  >
    {children}
  </Button>
);

interface Props {
  initialMarkdown: string;
  onChange: (markdown: string) => void;
  onSave: () => void;
  onDiscard: () => void;
  dirty: boolean;
  saving: boolean;
}
export const AboutEditor = ({ initialMarkdown, onChange, onSave, onDiscard, dirty, saving }: Props) => {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTab, setLinkTab] = useState<"external" | "files">("external");
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const { data: filesData, loading: filesLoading, refresh: refreshFiles } = useGet<FilesResponse>("/api/v1/files?limit=0");
  const autoFocus = useCallback((e: HTMLInputElement | null) => { if (e) e.focus() }, []);

  // block in-app navigation away from unsaved changes
  const blocker = useBlocker(dirty);
  // block closing/reloading/navigating the tab itself (browser-controlled, unstyled prompt)
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);
  // StarterKit's trailingNode extension silently appends an empty paragraph the first
  // time a transaction is dispatched (e.g. just clicking in) if the doc ends in a list or
  // heading -- that alone shouldn't count as an edit, so compare against the markdown as
  // serialized right after load rather than trusting docChanged.
  const lastMarkdownRef = useRef(initialMarkdown);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
        code: false,
        codeBlock: false,
        hardBreak: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: false,
          HTMLAttributes: { class: "link" },
        },
      }),
      Markdown.configure({ html: false }),
    ],
    content: initialMarkdown,
    // the toolbar reads editor.isActive(...) on every render; without this, moving the
    // cursor (a selection-only transaction) doesn't re-render, so button state goes stale
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class: "px-8 py-8 focus:outline-none",
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": "About section content",
      },
    },
    onCreate: ({ editor }) => {
      lastMarkdownRef.current = getMarkdown(editor);
    },
    onUpdate: ({ editor }) => {
      const markdown = getMarkdown(editor);
      if (markdown === lastMarkdownRef.current) return;
      lastMarkdownRef.current = markdown;
      onChange(markdown);
    },
  });

  if (!editor) return null;

  const openLinkDialog = () => {
    // widen the selection to the whole link so its full text is editable, not just where the cursor is
    if (editor.isActive("link")) editor.chain().focus().extendMarkRange("link").run();
    const { from, to } = editor.state.selection;
    const href = editor.getAttributes("link").href || "";
    setLinkText(editor.state.doc.textBetween(from, to, " "));
    setLinkUrl(href);
    const isFileLink = !!href && filesData?.files.some((f) => f.url === href);
    setLinkTab(isFileLink ? "files" : "external");
    setLinkDialogOpen(true);
  };

  const selectLinkFile = (file: FilesEntry) => {
    setLinkUrl(file.url);
    if (!linkText.trim()) setLinkText(getFilename(file));
  };

  const applyLink = () => {
    const text = linkText.trim();
    if (!text) {
      setLinkDialogOpen(false);
      return;
    }
    const url = linkUrl.trim();
    const { from, to } = editor.state.selection;
    editor
      .chain()
      .focus()
      .insertContentAt(
        { from, to },
        { type: "text", text, marks: url ? [{ type: "link", attrs: { href: url } }] : [] }
      )
      .run();
    setLinkDialogOpen(false);
  };

  const onLinkDialogKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyLink();
    }
  };

  const confirmDiscard = () => {
    const scrollY = window.scrollY;
    // emitUpdate: false so this reset doesn't get reported back through onChange as a new edit.
    // setContent maps the old (possibly mid-edit) cursor position into the reverted doc, and
    // focusing there was scrolling the page to an unrelated spot -- reset the selection to the
    // start instead, and restore the page's scroll position so discarding doesn't move the
    // viewport at all.
    editor.chain().setContent(initialMarkdown, { emitUpdate: false }).setTextSelection(0).run();
    window.scrollTo({ top: scrollY });
    lastMarkdownRef.current = getMarkdown(editor);
    onDiscard();
    setDiscardDialogOpen(false);
  };

  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      <div className="sticky top-24 z-20 flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-md">
        <ToolbarButton
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Link"
          title={
            editor.isActive("link")
              ? "Edit link"
              : editor.state.selection.empty ? "Insert link" : "Add link"
          }
          active={editor.isActive("link")}
          onClick={openLinkDialog}
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Remove link"
          title={editor.isActive("link") ? "Remove link" : "Place the cursor inside a link to remove it"}
          disabled={!editor.isActive("link")}
          onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}
        >
          <Unlink className="h-4 w-4" />
        </ToolbarButton>
        <div className="ml-auto flex items-center gap-3 pr-1">
          {dirty && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDiscardDialogOpen(true)}
              disabled={saving}
            >
              <Undo2 className="mr-2 h-4 w-4" />
              Discard changes
            </Button>
          )}
          <Button type="button" size="sm" onClick={onSave} disabled={saving || !dirty}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <main className="text-slate-600">
        <section className="about-editor-content w-full">
          <EditorContent editor={editor} />
        </section>
      </main>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Link</DialogTitle>
            <DialogDescription>Link to an external URL or an uploaded file.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Tabs value={linkTab} onValueChange={(v) => setLinkTab(v as "external" | "files")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="external">External Link</TabsTrigger>
                <TabsTrigger value="files">Files</TabsTrigger>
              </TabsList>
              <TabsContent value="external" className="flex flex-col gap-1">
                <label htmlFor="link-url" className="text-sm text-gray-500">URL</label>
                <Input
                  id="link-url"
                  ref={autoFocus}
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  onKeyDown={onLinkDialogKeyDown}
                />
              </TabsContent>
              <TabsContent value="files">
                <FileLinkPicker
                  data={filesData}
                  loading={filesLoading}
                  selectedUrl={linkUrl}
                  onSelect={selectLinkFile}
                  onUploaded={refreshFiles}
                  inputRef={autoFocus}
                />
              </TabsContent>
            </Tabs>
            <div className="flex flex-col gap-1">
              <label htmlFor="link-text" className="text-sm text-gray-500">Text</label>
              <Input
                id="link-text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                onKeyDown={onLinkDialogKeyDown}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={applyLink} disabled={!linkText.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Discard changes?</DialogTitle>
            <DialogDescription>
              This will discard your unsaved changes and restore the last saved version. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDiscardDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDiscard}>
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {blocker.state === "blocked" && (
        <Dialog open onOpenChange={(open) => { if (!open) blocker.reset(); }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Leave without saving?</DialogTitle>
              <DialogDescription>
                You have unsaved changes. If you leave this page now, they will be lost.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => blocker.reset()}>
                Stay
              </Button>
              <Button type="button" variant="destructive" onClick={() => blocker.proceed()}>
                Leave without saving
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
