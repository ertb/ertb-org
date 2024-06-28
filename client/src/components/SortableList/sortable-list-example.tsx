import { useState } from "react"
import { SortableList } from "./SortableList"

export const SortableListExample = () => {
  const mockItems = Array(50).fill(0).map((_,id)=>({id}))
  const [items, setItems] = useState(mockItems)
  return (
    <SortableList
      items={items}
      onChange={setItems}
      renderItem={(item) => (
        <SortableList.Item id={item.id}>
          {item.id}
          <SortableList.DragHandle />
        </SortableList.Item>
      )}
    />
  )
}