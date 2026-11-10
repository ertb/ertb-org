import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { UploadProgress } from './upload-progress'
import { UploadOptions } from './upload-file'
import { useUploads } from './use-uploads'

const MB = 1024 * 1024

describe('UploadProgress', () => {
  it('renders nothing when there are no uploads', () => {
    const {container} = render(<UploadProgress uploads={[]}/>)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the name, amount sent, and percent for each upload', () => {
    render(<UploadProgress uploads={[{id: 1, name: 'report.pdf', loaded: 1.5 * MB, total: 6 * MB, cancel: vi.fn()}]}/>)
    expect(screen.getByText('report.pdf')).toBeInTheDocument()
    expect(screen.getByText('1.5 MB of 6 MB · 25%')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', {name: 'Uploading report.pdf'})).toHaveAttribute('aria-valuenow', '25')
  })

  it('shows "Saving…" without a cancel button once everything is sent', () => {
    render(<UploadProgress uploads={[{id: 1, name: 'report.pdf', loaded: 6 * MB, total: 6 * MB, cancel: vi.fn()}]}/>)
    expect(screen.getByText('Saving…')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('cancels an upload', async () => {
    const cancel = vi.fn()
    render(<UploadProgress uploads={[{id: 1, name: 'report.pdf', loaded: 0, total: MB, cancel}]}/>)
    await userEvent.setup().click(screen.getByRole('button', {name: 'Cancel upload of report.pdf'}))
    expect(cancel).toHaveBeenCalled()
  })
})

describe('useUploads', () => {
  it('tracks progress until the upload settles, and cancels via the signal', async () => {
    const {result} = renderHook(() => useUploads())
    let options: UploadOptions = {}
    let finish: (value: string) => void = () => {}
    const file = new File(['x'.repeat(100)], 'a.pdf')

    let promise: Promise<string> = Promise.resolve('')
    act(() => {
      promise = result.current.track(file, (o) => {
        options = o
        return new Promise<string>((resolve) => { finish = resolve })
      })
    })
    expect(result.current.uploads).toMatchObject([{name: 'a.pdf', loaded: 0, total: 100}])

    act(() => options.onProgress?.(40, 100))
    expect(result.current.uploads[0]).toMatchObject({loaded: 40, total: 100})

    act(() => result.current.uploads[0].cancel())
    expect(options.signal?.aborted).toBe(true)

    await act(async () => { finish('done'); await promise })
    expect(result.current.uploads).toEqual([])
  })
})
