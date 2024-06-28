import { DownloadFiles } from "../../components/download-files"

export const Administration = () => {
  const lists = {
    "Notice/Agenda": "agenda",
    "Minutes": "minutes",
    "Reports": "reports",
    "Financials": "financials",
  }

  return (<>
    <div className="flex flex-wrap justify-center gap-8">
      {Object.entries(lists).map(([title, tag])=>(
        <DownloadFiles key={title} title={<h3>{title}</h3>} tag={tag}/>
      ))}
    </div>
  </>)
}