import React from 'react';
import { clsx } from 'clsx';
import './Table.css';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  width?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  className?: string;
  zebra?: boolean;
}

const Table = <T extends { id: string | number }>({
  columns,
  data,
  isLoading,
  onRowClick,
  className,
  zebra = false,
}: TableProps<T>) => {
  return (
    <div className={clsx('ag-table-container', className)}>
      <table className={clsx('ag-table', zebra && 'ag-table--zebra')}>
        <thead className="ag-table__header">
          <tr>
            {columns.map((col) => (
              <th 
                key={col.key as string} 
                className="ag-table__th"
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="ag-table__body">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="ag-table__loading-cell">
                <div className="ag-table__skeleton"></div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="ag-table__empty-cell">
                No se encontraron datos
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr 
                key={row.id} 
                className={clsx('ag-table__tr', onRowClick && 'ag-table__tr--clickable')}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((col) => (
                  <td key={col.key as string} className="ag-table__td">
                    {col.render ? col.render(row) : (row as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
