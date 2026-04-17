import React from "react";

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
}

export default function Table<T>({ columns, data }: TableProps<T>) {
  return (
    <div className="app-table-shell overflow-x-auto">
      <table className="app-table min-w-full">
        <thead className="app-table-head">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white">
          {data.map((item, rowIdx) => (
            <tr key={rowIdx} className="app-table-row">
              {columns.map((col, colIdx) => (
                <td key={colIdx} className="app-table-cell whitespace-nowrap">
                  {typeof col.accessor === "function" ? col.accessor(item) : (item[col.accessor] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
