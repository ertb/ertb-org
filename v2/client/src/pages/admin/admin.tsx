import { CredentialResponse, GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google"

export const AdminPage = () => {
  const clientId = import.meta.env.GOOGLE_API_CLIENT_ID
  if (!clientId) throw new Error('GOOGLE_API_CLIENT_ID is not set')

  const onSuccess = (cred:CredentialResponse) => {
    console.log('CredentialResponse:', cred)
  }
  const onError = () => console.error('google login failed')
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <GoogleLogin onSuccess={onSuccess} onError={onError} useOneTap/>

      Welcome to the Admin Page
    </GoogleOAuthProvider>
  )
}