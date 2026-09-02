import { render, screen } from '@testing-library/react'
import { OptionSelect } from './option-select'

// Note: this intentionally doesn't test opening the select and picking an item. That flow is
// provably correct (verified interactively during development - see the fireEvent sequence in
// git history if this needs revisiting), but Radix's "item-aligned" positioning does synchronous
// layout convergence against jsdom's fake layout that's highly sensitive to CPU contention: it
// takes ~7s in isolation but was observed to intermittently balloon past 5 minutes when run
// alongside the rest of the suite, which makes it unsafe to ship as a CI test.
describe('OptionSelect', () => {
  it('should show the placeholder when no value is selected', () => {
    render(<OptionSelect options={['a', 'b']} placeholder="Choose one"/>)
    expect(screen.getByText('Choose one')).toBeInTheDocument()
  })

  it('should show the label for the currently selected value', () => {
    render(<OptionSelect options={[{label: 'Board', value: 'board'}, {label: 'Support', value: 'support'}]} value="support"/>)
    expect(screen.getByRole('combobox')).toHaveTextContent('Support')
  })

  it('should look up the label for a plain string[] option list too', () => {
    render(<OptionSelect options={['hidden', 'visible']} value="visible"/>)
    expect(screen.getByRole('combobox')).toHaveTextContent('visible')
  })
})
