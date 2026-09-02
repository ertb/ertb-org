import { DocumentList } from "../../components/document-list";

export const DownloadLists = () => {
  const lists = {
    "Notice/Agenda": "agenda",
    Minutes: "minutes",
    Reports: "reports",
    Financials: "financials",
    Grants: "grants",
    RFP: "rfp",
    "Cyber Security": "cyber",
  };

  return (
    <>
      <div className="list flex flex-wrap justify-center gap-8">
        {Object.entries(lists).map(([title, tag]) => (
          <>
            <div id={tag} />
            <DocumentList key={title} title={<h2>{title}</h2>} tag={tag} all />
          </>
        ))}
      </div>
    </>
  );
};
