import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAuthRestClient } from "@/contexts/auth-rest-client-context";
import { AboutResponse } from "@/lib/api-schema";
import { useGet } from "@/lib/rest-client/use-get";
import { RestClientResponseError } from "@/lib/rest-client/rest-client";
import { AboutEditor } from "./about-editor";
import fallbackMarkdown from "../home/about-fallback.md?raw";

export const About = () => {
  const { data, error } = useGet<AboutResponse>("/api/v1/about");
  const { authPut } = useAuthRestClient();
  const { toast } = useToast();

  const [markdown, setMarkdown] = useState<string>();
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const initialMarkdown = data ? data.markdown : error ? fallbackMarkdown : undefined;

  const save = () => {
    if (markdown === undefined) return;
    setSaving(true);
    authPut("/api/v1/about", { markdown })
      .then(() => {
        setDirty(false);
        toast.success("About section saved");
      })
      .catch((e) => {
        if (e instanceof RestClientResponseError && e.isAuthError()) {
          toast.error(
            "Not authorized",
            "Your session may have expired. Try refreshing."
          );
          return;
        }
        toast.error(`Couldn't save the About section`);
      })
      .finally(() => setSaving(false));
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-center">About</h2>

      {initialMarkdown === undefined ? (
        <div className="text-gray-500">Loading…</div>
      ) : (
        <AboutEditor
          initialMarkdown={initialMarkdown}
          onChange={(value) => {
            setMarkdown(value);
            setDirty(true);
          }}
          onSave={save}
          dirty={dirty}
          saving={saving}
        />
      )}
    </div>
  );
};
