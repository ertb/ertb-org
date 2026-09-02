import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { ConfirmDeleteButton } from './confirm-delete-button'

describe('ConfirmDeleteButton', () => {
  it('should hide the confirm button until the delete icon is clicked', async () => {
    const user = userEvent.setup()
    render(<ConfirmDeleteButton />)

    expect(screen.getByRole('button', {name: 'Delete'})).toHaveClass('hidden')

    await user.click(screen.getAllByRole('button')[0])
    expect(screen.getByRole('button', {name: 'Delete'})).not.toHaveClass('hidden')
  })

  it('should call onDelete and hide the confirm button when confirmed', async () => {
    const onDelete = vi.fn()
    const user = userEvent.setup()
    render(<ConfirmDeleteButton onDelete={onDelete} />)

    await user.click(screen.getAllByRole('button')[0])
    await user.click(screen.getByRole('button', {name: 'Delete'}))

    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', {name: 'Delete'})).toHaveClass('hidden')
  })

  it('should hide the confirm button, without calling onDelete, when clicking outside', async () => {
    const onDelete = vi.fn()
    const user = userEvent.setup()
    render(<div><ConfirmDeleteButton onDelete={onDelete} /><div data-testid="outside">outside</div></div>)

    await user.click(screen.getAllByRole('button')[0])
    expect(screen.getByRole('button', {name: 'Delete'})).not.toHaveClass('hidden')

    await user.click(screen.getByTestId('outside'))
    expect(screen.getByRole('button', {name: 'Delete'})).toHaveClass('hidden')
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('should position the confirm button on the left when the `left` prop is set', () => {
    render(<ConfirmDeleteButton left />)
    expect(screen.getByRole('button', {name: 'Delete'})).toHaveClass('left-1')
  })

  it('should support a custom label', () => {
    render(<ConfirmDeleteButton label="Remove" />)
    expect(screen.getByRole('button', {name: 'Remove'})).toBeInTheDocument()
  })
})
