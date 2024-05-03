import { DownloadFiles } from "../../components/download-files"

export const DownloadLists = () => {
  const lists = {
    "Notice/Agenda": "agenda",
    "Minutes": "minutes",
    "Reports": "reports",
    "Financials": "financials",
    "Grants": "grants",
    "RFP": "rfp",
  }

  return (<>
    <div className="list flex flex-wrap justify-center gap-8">
      {Object.entries(lists).map(([title, tag])=>(
        <DownloadFiles key={title} title={<h2>{title}</h2>} tag={tag} all/>
      ))}
    </div>
  </>)
}