import { NavHeader } from "@/components/nav-header"
import { BoardMembers } from "./board-members"
import { Administration } from "./administration"
import { OpenInNewWindowIcon } from "@radix-ui/react-icons"
import { DownloadFiles } from "../../components/download-files"
import { ContactForm } from "./contact-form"
import { AppFooter } from "@/components/app-footer"

export const HomePage = () => {
  const navLinks = {
    'Board': 'board',
    'Administration': 'admin',
    'Grants': 'grants',
    'RFP': 'rfp',
    'Contact': 'contact',
  }
  return (<>
    <NavHeader links={navLinks} hero>
      <div className="h-96 md:h-[550px] w-full bg-[url('/img/ian-baldwin-82170.jpg')] bg-cover bg-center">
        {/** cover image */}
      </div>
    </NavHeader>
    <main className="text-slate-600">
      <h1 className='sr-only'>Electronic Recording Technology Board</h1>

      <section id="about" className="w-full px-8 py-16 lg:px-32">
        <h2>About</h2>

        <h3>Our Background</h3>
        <p>In the state of Colorado, a one dollar per document technology fee was implemented in the early 2000’s to aid County offices across the state in funding technological advancements in recording. As a result, Colorado was the first multi-jurisdictional state in the nation to adopt e-Recording across the state.</p>
        <p>In the spring of 2014, a working group made up of real estate, lending, legal professionals as well as counties conducted a statewide needs assessment and a request for information to evaluate the state of recording systems in Colorado.</p>
        <p>In the spring of 2016, legislation was passed and this board and a funding structure were created from Senate Bill 16-115.</p>
        <p>In 2021, the Electronic Recording Technology Board was extended for an additional five years.</p>

        <ol>
          <li><a href="http://leg.colorado.gov/sites/default/files/2016a_115_signed.pdf" target="_blank">Senate Bill 16-155 <OpenInNewWindowIcon className="inline"/></a></li>
          <li><a href="http://leg.colorado.gov/sites/default/files/2021a_1225_signed.pdf" target="_blank">Senate Bill 21-1225 <OpenInNewWindowIcon className="inline"/></a></li>
        </ol>

        <h3>Our Vision</h3>
        <p>To create, support, and maintain a statewide land records environment that promotes accessibility and consistency for the public in an efficient and user-friendly manner.</p>

        <h3>Our Mission</h3>
        <p>To develop, maintain, improve, replace, or preserve land records systems in our state.</p>

        <h3>Our Core Goals</h3>
        <ul>
          <li>Assure the security, accuracy, and preservation of public records required to be maintained by a Clerk and Recorder.</li>
          <li>Assure that the sequence in which documents are received by a clerk and recorder is accurately reflected to the greatest extent practicable.</li>
          <li>Provide for online public access to public documents while maintaining the privacy of personal identifying information when applicable.</li>
          <li>Assure that electronic filing systems used in different counties are similar so as to facilitate the submission and searching of electronic records.</li>
        </ul>

        <h3>Our Objectives</h3>
        <ol>
          <li> Develop a strategic plan that incorporates the core goals and establish the administration of the Electronic Recording Technology Fund and Board.</li>
          <li>Determine functionality standards for an electronic filing system that supports the core goals.</li>
          <li>Issue a Request for Proposal (RFP) for electronic filing systems, equipment and software that the counties may choose to acquire.</li>
          <li>Develop best practices for an electronic filing system.</li>
          <li>Provide training to Clerk and Recorders related to electronic filing systems.</li>
          <li>Develop a grant program, prepare reports and promulgate any necessary rule-making.</li>
          <li>Develop subcommittees and project timelines for implementation.</li>
        </ol>
      </section>

      <section id="board" className="w-full px-8 py-16 lg:px-32 bg-slate-100">
        <h2>Board</h2>
        <BoardMembers/>
      </section>
      <section id="admin" className="w-full px-8 py-16 lg:px-32">
        <h2>Administration</h2>
        <Administration/>
      </section>
      <section id="grants" className="px-8 py-16 lg:px-32 bg-slate-100">
        <h2>Grants</h2>
        <div className="md:w-3/4 mx-auto">
          <DownloadFiles tag='grants' full/>
        </div>
      </section>
      <section id="rfp" className="px-8 py-16 lg:px-32">
        <h2>RFP</h2>
        <div className="md:w-3/4 mx-auto">
          <DownloadFiles tag='rfp' full/>
        </div>
      </section>
      <section id="contact" className="dark px-8 py-16 lg:px-32 bg-sky-950">
        <h2>Contact Us</h2>
        <div className="md:w-3/4 mx-auto">
          <ContactForm/>
        </div>
      </section>
    </main>
    <AppFooter/>
  </>)
}