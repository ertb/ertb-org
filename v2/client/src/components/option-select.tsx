import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

interface Option {
    label: string
    value: string
}
interface Props {
    value?: string
    options: Option[] | string[]
    onValueChange?: (value:string)=>void
    placeholder?: string
    className?: string
}

const SelectItems = ({items}:{items: Option[]}) => {
    return <>
    { items.map(({label, value},i) => <SelectItem key={i} value={value}>{label}</SelectItem>) }
    </>
}

const normalizeItems = (items: Option[] | string[]) => (typeof items[0] == 'string') ? items.map(s=>({label:s, value:s} as Option)) : items as Option[]

export const OptionSelect = ({value, options: items, onValueChange, placeholder='Select an item', className}:Props) => {
    items = normalizeItems(items)

    return (
      <Select onValueChange={onValueChange} value={value||''}>
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItems items={items}/>
        </SelectContent>
      </Select>
    )
}