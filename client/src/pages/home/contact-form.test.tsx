import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { ContactForm } from './contact-form'

const server = setupServer()
beforeAll(() => server.listen({onUnhandledRequest: 'error'}))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const fillValidForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText('Name'), 'Jane Doe')
  await user.type(screen.getByLabelText('Email'), 'jane@example.com')
  await user.type(screen.getByLabelText('Phone'), '5551234567')
  await user.type(screen.getByLabelText('Message'), 'Hello there')
}

describe('ContactForm', () => {
  it('should render all the fields', () => {
    render(<ContactForm/>)
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Phone')).toBeInTheDocument()
    expect(screen.getByLabelText('Message')).toBeInTheDocument()
  })

  it('should show validation errors and not submit when the form is empty', async () => {
    // fields with no defaultValue submit as undefined, which fails zod's base type check
    // ("Required") rather than reaching the .min()/.email() custom messages, which only apply
    // once a value is already the right type.
    const user = userEvent.setup()
    server.use(http.post('/api/v1/messages', () => {
      throw new Error('should not be called')
    }))
    render(<ContactForm/>)

    await user.click(screen.getByRole('button', {name: 'Send Message'}))

    const errors = await screen.findAllByText('Required')
    expect(errors).toHaveLength(4)
  })

  it('should show the custom min-length message once a too-short value is entered', async () => {
    const user = userEvent.setup()
    render(<ContactForm/>)

    await user.type(screen.getByLabelText('Name'), 'a')
    await user.type(screen.getByLabelText('Phone'), '123')
    await user.click(screen.getByRole('button', {name: 'Send Message'}))

    expect(await screen.findByText('Name is required')).toBeInTheDocument()
    expect(screen.getByText('Expecting 10 digits')).toBeInTheDocument()
  })

  it('should submit valid data and clear the message field on success', async () => {
    const user = userEvent.setup()
    server.use(http.post('/api/v1/messages', async ({request}) => {
      expect(await request.json()).toEqual({
        name: 'Jane Doe', email: 'jane@example.com', phone: '5551234567', message: 'Hello there',
      })
      return HttpResponse.json({insertedId: '1'})
    }))
    render(<ContactForm/>)

    await fillValidForm(user)
    await user.click(screen.getByRole('button', {name: 'Send Message'}))

    await waitFor(() => expect(screen.getByLabelText('Message')).toHaveValue(''))
    // other fields are left as-is
    expect(screen.getByLabelText('Name')).toHaveValue('Jane Doe')
  })

  it('should re-enable the form after a failed submission, without clearing it', async () => {
    const user = userEvent.setup()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    server.use(http.post('/api/v1/messages', () => new HttpResponse(null, {status: 500})))
    render(<ContactForm/>)

    await fillValidForm(user)
    const submit = screen.getByRole('button', {name: 'Send Message'})
    await user.click(submit)

    await waitFor(() => expect(submit).not.toBeDisabled())
    expect(screen.getByLabelText('Message')).toHaveValue('Hello there')
    consoleError.mockRestore()
  })
})
