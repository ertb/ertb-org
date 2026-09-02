import Markdown, { Components } from "react-markdown";
import { OpenInNewWindowIcon } from "@radix-ui/react-icons";
import { ConfirmDocumentLink } from "@/components/confirm-document-link";
import { useGet } from "@/lib/rest-client/use-get";
import { AboutResponse } from "@/lib/api-schema";
import fallbackMarkdown from "./about-fallback.md?raw";

const allowedElements = ["h2", "h3", "p", "ul", "ol", "li", "strong", "em", "a"];

const components: Components = {
  a: ({ href, children }) => (
    <ConfirmDocumentLink href={href || ""}>
      {children}
      <OpenInNewWindowIcon className="inline" />
    </ConfirmDocumentLink>
  ),
};

export const AboutContent = () => {
  const { data } = useGet<AboutResponse>("/api/v1/about");
  const markdown = data?.markdown || fallbackMarkdown;

  return (
    <Markdown
      allowedElements={allowedElements}
      unwrapDisallowed
      components={components}
    >
      {markdown}
    </Markdown>
  );
};
