import { FilesEntry } from "./api-schema"

export const fileTags = [
  { value: "agenda", label: "Agenda" },
  { value: "reports", label: "Reports" },
  { value: "minutes", label: "Minutes" },
  { value: "financials", label: "Financials" },
  { value: "grants", label: "Grants" },
  { value: "rfp", label: "RFP" },
  { value: "cyber", label: "Cyber Security" },
  { value: "hidden", label: "Hidden" },
]

export const getFilename = (file: FilesEntry) => {
  const n = new URL(file.url).pathname.split("/")
  const filename = decodeURIComponent(n[n.length - 1])
  return filename
}
