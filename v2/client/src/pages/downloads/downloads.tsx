import { AppFooter } from "@/components/app-footer"
import { NavHeader } from "@/components/nav-header"
import { DownloadLists } from "./download-lists"
import './downloads.css'

export const DownloadsPage = () => {
  return (<>
    <NavHeader title="Downloads"/>
    <main className="download-page pt-20">
      <h1 className="sr-only">Downloads</h1>
      <section id="admin" className="w-full px-8 py-16 lg:px-32">
        <DownloadLists/>
      </section>
    </main>
    <AppFooter/>
  </>)
}