import { Link } from "react-router-dom";
import { Button } from "./ui/button";

export const NotFound = () => (
  <div className="flex min-h-screen text-white bg-slate-600">
    <div className="m-auto text-center max-w-sm">
      <h1 className='text-white text-9xl mb-4 normal-case'>Oops!</h1>
      <h2 className='text-white text-xl mb-4'>404 - Page Not Found</h2>
      <p>The page you are looking for might have been removed, had it's name changed or is temporarily unavailable.</p>
      <Link to='/'><Button className='mt-8'>Got To Homepage</Button></Link>
    </div>
  </div>
)