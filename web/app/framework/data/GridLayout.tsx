"use client";

import React from "react";
import { flushSync } from "react-dom";
import { useApp } from "@/framework/ui/context/AppContext";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

type GridSpec = `${number}x${number}`;
type Layout = "one-column" | "one-row" | GridSpec;

type Props = {
  children: React.ReactNode;
  title?: string;
  className?: string;
  layout?: Layout;
  table?: string;
  onReorder?: (fromIndex: number, toIndex: number) => void;
};

function resolveGrid(layout: Layout): React.CSSProperties & { className: string } {
  const gapValue = 3; // Tailwind gap-3
  if (layout === "one-column") {
    return { className: `flex flex-col gap-${gapValue}` };
  }
  if (layout === "one-row") {
    return { className: `flex flex-row gap-${gapValue} overflow-x-auto` };
  }
  const [rows, cols] = layout.split("x").map(Number);
  return {
    className: `grid gap-${gapValue}`,
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${rows}, auto)`,
  };
}

export default function GridLayout({ children, title, className = "", layout = "one-column", table, onReorder }: Props) {
  const { tableLoadings, prismaFields } = useApp();
  const { className: gridClass, ...gridStyle } = resolveGrid(layout);
  const tableLoading = table ? tableLoadings[table] : undefined;

  const hasPositionField = table
    ? (prismaFields[table] ?? []).some((f) => f.name === "position")
    : true;
  const canReorder = !!onReorder && hasPositionField;

  const header = (
    <div className="flex items-center gap-3 mb-3">
      {title && <h2 className="text-lg font-semibold text-gray-700">{title}</h2>}
      {tableLoading && (
        <span className="text-xs text-gray-400 font-mono">
          [{tableLoading.status}] {tableLoading.operation} on <strong>{tableLoading.model}</strong>
          {tableLoading.durationMs != null && ` — ${tableLoading.durationMs}ms`}
        </span>
      )}
    </div>
  );

  const childrenArray = React.Children.toArray(children);

  if (!canReorder) {
    return (
      <div className={className}>
        {header}
        <div className={gridClass} style={gridStyle}>
          {childrenArray.map((child, index) => (
            <React.Fragment key={index}>{child}</React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  const handleDragEnd = (result: DropResult) => {
    const dest = result.destination;
    if (!dest) return;
    if (result.source.index === dest.index) return;
    flushSync(() => {
      onReorder!(result.source.index, dest.index);
    });
  };

  // Strip gap from the container and apply as margin on each item so the
  // dnd placeholder can measure it correctly (gap is invisible to the library).
  const gapMatch = gridClass.match(/\bgap-(\S+)/);
  const gapValue = gapMatch?.[1];
  const dndContainerClass = gridClass.replace(/\bgap-\S+/, "").trim();
  const itemSpacing = gapValue
    ? layout === "one-row" ? `mr-${gapValue}` : `mb-${gapValue}`
    : "";

  return (
    <div className={className}>
      {header}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="grid" direction={layout === "one-row" ? "horizontal" : "vertical"}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={dndContainerClass}
              style={gridStyle}
            >
              {childrenArray.map((child, index) => (
                <Draggable key={index} draggableId={`item-${index}`} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={provided.draggableProps.style}
                      className={`cursor-grab active:cursor-grabbing ${itemSpacing}`}
                    >
                      {child}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
