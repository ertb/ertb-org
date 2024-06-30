import { useUserProfile } from "@/contexts/user-login-context"

export const SignInWithGoogleButton = () => {
  const { login } = useUserProfile()
  return (
    <button onClick={login} className="px-4 py-2 border flex gap-2 bg-white border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:shadow transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
      <img className="w-6 h-6" src="https://www.svgrepo.com/show/475656/google-color.svg" loading="lazy" alt="google logo"/>
      <span>Sign in with Google</span>
    </button>
  )
}