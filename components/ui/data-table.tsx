'use client';

import { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Search,
  Plus,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Column {
  key: string;
  label: string;
  sortable: boolean;
  render?: (item: any) => React.ReactNode;
}

interface DataTableProps<T> {
  title?: string;
  columns: Column[];
  data: any[];
  onAdd?: () => void;
  onEdit?: (item: any) => void;
  onDelete?: (id: string) => void;
  onExport?: () => void;
  onView?: (item: T) => void;
  renderCustomCell?: (column: Column, item: any) => React.ReactNode;
}

export function DataTable<T>({
  title,
  columns,
  data,
  onAdd,
  onEdit,
  onDelete,
  onExport,
  onView,
  renderCustomCell
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });

  const handleSort = (key: string) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const filteredData = data.filter(item =>
    Object.values(item).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = String(a[sortConfig.key]);
    const bValue = String(b[sortConfig.key]);
    return sortConfig.direction === 'asc' 
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
      {/* Search bar */}
      <div className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search accounts..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-4 bg-gray-50 dark:bg-gray-800 text-left text-sm font-semibold text-gray-900 dark:text-gray-100"
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUp className={`h-3 w-3 ${
                          sortConfig.key === column.key && sortConfig.direction === 'asc'
                            ? 'text-blue-500'
                            : 'text-gray-400'
                        }`} />
                        <ChevronDown className={`h-3 w-3 ${
                          sortConfig.key === column.key && sortConfig.direction === 'desc'
                            ? 'text-blue-500'
                            : 'text-gray-400'
                        }`} />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => (
              <tr 
                key={index}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                {columns.map((column) => (
                  <td 
                    key={column.key} 
                    className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100"
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
            {sortedData.length === 0 && (
              <tr>
                <td 
                  colSpan={columns.length} 
                  className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 