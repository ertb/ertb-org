import React, { useMemo, useState } from "react"
import type { ReactNode } from "react"
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import type { Active, UniqueIdentifier, DragEndEvent, DragStartEvent } from "@dnd-kit/core"
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable"

import "./SortableList.css"
import { SortableOverlay } from "./SortableOverlay"
import { DragHandle, SortableItem } from "./SortableItem"

export interface BaseItem {
  id: UniqueIdentifier
}

interface Props<T extends BaseItem> {
  items: T[]
  onChange(items: T[]): void
  renderItem(item: T): ReactNode
}

export function SortableList<T extends BaseItem>({
  items,
  onChange,
  renderItem
}: Props<T>) {
  const [active, setActive] = useState<Active | null>(null)
  const activeItem = useMemo(
    () => items.find((item) => item.id === active?.id),
    [active, items]
  )
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const onDragStart=(e:DragStartEvent)=>setActive(e.active)
  const onDragEnd=(e:DragEndEvent)=>{
    if (e.over && e.active.id !== e.over?.id) {
      const activeIndex = items.findIndex(({ id }) => id === e.active.id)
      const overIndex = items.findIndex(({ id }) => id === e.over?.id)

      onChange(arrayMove(items, activeIndex, overIndex))
    }
    setActive(null)
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={()=>setActive(null)}
    >
      <SortableContext items={items}>
        <ul className="SortableList" role="application">
          {items.map((item) => (
            <React.Fragment key={item.id}>{renderItem(item)}</React.Fragment>
          ))}
        </ul>
      </SortableContext>
      <SortableOverlay>
        {activeItem ? renderItem(activeItem) : null}
      </SortableOverlay>
    </DndContext>
  )
}

SortableList.Item = SortableItem
SortableList.DragHandle = DragHandle
