import { useState, useEffect } from 'react'
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  flexRender, type ColumnDef, type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown, ChevronsUpDown, Settings2 } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'
import { Button } from './index'

interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T, unknown>[]
  storageKey?: string
  loading?: boolean
  onRowClick?: (row: T) => void
}

export function DataTable<T>({ data, columns, storageKey, loading, onRowClick }: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    if (!storageKey) return {}
    try { return JSON.parse(localStorage.getItem(`dt_vis_${storageKey}`) ?? '{}') } catch { return {} }
  })

  useEffect(() => {
    if (storageKey) localStorage.setItem(`dt_vis_${storageKey}`, JSON.stringify(columnVisibility))
  }, [columnVisibility, storageKey])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="w-full">
      {storageKey && (
        <div className="flex justify-end mb-2">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button variant="outline" size="sm"><Settings2 className="h-3.5 w-3.5" />Columns</Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" className="z-50 bg-white border border-slate-200 rounded-lg shadow-lg p-1 min-w-[160px]">
                {table.getAllLeafColumns().map(col => (
                  <DropdownMenu.CheckboxItem key={col.id} checked={col.getIsVisible()} onCheckedChange={col.toggleVisibility}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-slate-50 outline-none capitalize">
                    {typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id}
                  </DropdownMenu.CheckboxItem>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(h => (
                    <th key={h.id} className="text-left text-xs font-medium text-slate-500 px-3 py-2.5 whitespace-nowrap">
                      {h.isPlaceholder ? null : h.column.getCanSort() ? (
                        <button className="flex items-center gap-1 hover:text-slate-900 transition-colors" onClick={h.column.getToggleSortingHandler()}>
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {h.column.getIsSorted() === 'asc' ? <ChevronUp className="h-3 w-3" />
                            : h.column.getIsSorted() === 'desc' ? <ChevronDown className="h-3 w-3" />
                            : <ChevronsUpDown className="h-3 w-3 opacity-40" />}
                        </button>
                      ) : flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((_, j) => (
                      <td key={j} className="px-3 py-3">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <tr><td colSpan={columns.length} className="text-center text-sm text-slate-400 py-10">No results</td></tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                    className={cn('hover:bg-slate-50/80 transition-colors', onRowClick && 'cursor-pointer')}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-3 py-2.5 text-slate-700 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
