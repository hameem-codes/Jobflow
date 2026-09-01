import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, GripVertical } from "lucide-react";

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  onDelete?: () => void;
}

function SortableItem({ id, children, onDelete }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="sortable-item"
    >
      <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
        <button
          {...listeners}
          style={{
            background: "none",
            border: "none",
            cursor: "grab",
            padding: "10px",
            display: "flex",
            alignItems: "center",
            color: "var(--muted)",
          }}
          title="Drag to reorder"
        >
          <GripVertical size={18} />
        </button>
        <div style={{ flex: 1 }}>{children}</div>
        {onDelete && (
          <button
            onClick={onDelete}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "red",
              padding: "10px",
              display: "flex",
              alignItems: "center",
            }}
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

interface DraggableSectionListProps<T extends { id: string }> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, onDelete: () => void) => React.ReactNode;
  onDelete: (id: string) => void;
}

export function DraggableSectionList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  onDelete,
}: DraggableSectionListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      onReorder(newItems);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {items.map((item) => (
            <SortableItem
              key={item.id}
              id={item.id}
              onDelete={() => onDelete(item.id)}
            >
              <div
                style={{
                  border: "1px solid var(--rule)",
                  padding: "15px",
                  borderRadius: "8px",
                }}
              >
                {renderItem(item, () => onDelete(item.id))}
              </div>
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
