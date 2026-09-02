import { KeyboardEvent, useCallback, useState } from "react";
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
  dirty: boolean;
  saving: boolean;
}
export const AboutEditor = ({ initialMarkdown, onChange, onSave, dirty, saving }: Props) => {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const autoFocus = useCallback((e: HTMLInputElement | null) => { if (e) e.focus() }, []);

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
    onUpdate: ({ editor }) => {
      onChange(getMarkdown(editor));
    },
  });

  if (!editor) return null;

  const canLink = !editor.state.selection.empty || editor.isActive("link");

  const openLinkDialog = () => {
    // widen the selection to the whole link so its full text is editable, not just where the cursor is
    if (editor.isActive("link")) editor.chain().focus().extendMarkRange("link").run();
    const { from, to } = editor.state.selection;
    setLinkText(editor.state.doc.textBetween(from, to, " "));
    setLinkUrl(editor.getAttributes("link").href || "");
    setLinkDialogOpen(true);
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
            canLink
              ? editor.isActive("link") ? "Edit link" : "Add link"
              : "Select text or place the cursor inside a link to add or edit one"
          }
          active={editor.isActive("link")}
          disabled={!canLink}
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
          <div role="status" aria-live="polite" className="text-sm text-gray-500">
            {dirty ? "Unsaved changes" : ""}
          </div>
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
            <DialogDescription>Set the link text and the URL it points to.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="link-text" className="text-sm text-gray-500">Text</label>
              <Input
                id="link-text"
                ref={autoFocus}
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                onKeyDown={onLinkDialogKeyDown}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="link-url" className="text-sm text-gray-500">URL</label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
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
    </div>
  );
};
