import { ReactNode, useMemo } from "react";

interface MasonryGridProps {
  children: ReactNode[];
  columns?: number;
  gap?: number;
  className?: string;
}

export function MasonryGrid({ 
  children, 
  columns = 2, 
  gap = 12,
  className = "" 
}: MasonryGridProps) {
  const columnItems = useMemo(() => {
    const cols: ReactNode[][] = Array.from({ length: columns }, () => []);
    
    children.forEach((child, index) => {
      const columnIndex = index % columns;
      cols[columnIndex].push(child);
    });
    
    return cols;
  }, [children, columns]);

  return (
    <div 
      className={className}
      style={{ 
        display: "flex", 
        gap: `${gap}px`,
      }}
    >
      {columnItems.map((items, colIndex) => (
        <div 
          key={colIndex}
          style={{ 
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: `${gap}px`,
          }}
        >
          {items}
        </div>
      ))}
    </div>
  );
}
