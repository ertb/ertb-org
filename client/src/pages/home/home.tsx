import { NavHeader } from "@/components/nav-header";
import { BoardMembers } from "./board-members";
import { Administration } from "./administration";
import { DocumentList } from "../../components/document-list";
import { ContactForm } from "./contact-form";
import { AppFooter } from "@/components/app-footer";
import { AboutContent } from "./about-content";

export const HomePage = () => {
  const navLinks = {
    Board: "board",
    Administration: "admin",
    Grants: "grants",
    RFP: "rfp",
    "Cyber Security": "cyber",
    Contact: "contact",
  };
  return (
    <>
      <NavHeader links={navLinks} hero>
        <div className="h-96 md:h-[550px] w-full bg-[url('/img/ian-baldwin-82170.jpg')] bg-cover bg-center">
          {/** cover image */}
        </div>
      </NavHeader>
      <main className="text-slate-600">
        <h1 className="sr-only">Electronic Recording Technology Board</h1>

        <section id="about" className="w-full px-8 py-16 lg:px-32">
          <AboutContent />
        </section>

        <section id="board" className="w-full px-8 py-16 lg:px-32 bg-slate-100">
          <h2>Board</h2>
          <BoardMembers />
        </section>
        <section id="admin" className="w-full px-8 py-16 lg:px-32">
          <h2>Administration</h2>
          <Administration />
        </section>
        <section id="grants" className="px-8 py-16 lg:px-32 bg-slate-100">
          <h2>Grants</h2>
          <div className="md:w-3/4 mx-auto">
            <DocumentList tag="grants" full />
          </div>
        </section>
        <section id="rfp" className="px-8 py-16 lg:px-32">
          <h2>RFP</h2>
          <div className="md:w-3/4 mx-auto">
            <DocumentList tag="rfp" full />
          </div>
        </section>
        <section id="cyber" className="px-8 py-16 lg:px-32 bg-slate-100">
          <h2>Cyber Security</h2>
          <div className="md:w-3/4 mx-auto">
            <DocumentList tag="cyber" full />
          </div>
        </section>
        <section id="contact" className="dark px-8 py-16 lg:px-32 bg-sky-950">
          <h2>Contact Us</h2>
          <div className="md:w-3/4 mx-auto">
            <ContactForm />
          </div>
        </section>
      </main>
      <AppFooter />
    </>
  );
};
