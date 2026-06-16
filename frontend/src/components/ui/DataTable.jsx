import { useState, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table'
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react'

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

function SortIcon({ sorted }) {
  if (sorted === 'asc')  return <ChevronUp size={12} color="#CC1A1A" />
  if (sorted === 'desc') return <ChevronDown size={12} color="#CC1A1A" />
  return <ChevronsUpDown size={12} color="#C4B9A8" />
}

export function DataTable({
  data = [],
  columns,
  loading = false,
  emptyIcon,
  emptyText = 'Nenhum registro encontrado',
  pageSize = 20,
  renderCard,
}) {
  const isMobile = useIsMobile()
  const [sorting, setSorting] = useState([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  const { pageIndex, pageSize: ps } = table.getState().pagination
  const totalPages = table.getPageCount()
  const from = pageIndex * ps + 1
  const to   = Math.min((pageIndex + 1) * ps, data.length)

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 24px' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (data.length === 0) return (
    <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {emptyIcon}
      <p style={{ fontSize: 14, color: '#8A7F76' }}>{emptyText}</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* MOBILE: cards */}
      {isMobile && renderCard && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {table.getRowModel().rows.map(row => renderCard(row.original))}
        </div>
      )}

      {/* DESKTOP: tabela */}
      {!isMobile && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id} style={{ background: '#F7F3EE', borderBottom: '1px solid #E0D6CA' }}>
                  {hg.headers.map(header => (
                    <th
                      key={header.id}
                      onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                      style={{
                        padding: '12px 20px', textAlign: 'left',
                        fontSize: 11, fontWeight: 700, color: '#8A7F76',
                        textTransform: 'uppercase', letterSpacing: '0.12em',
                        cursor: header.column.getCanSort() ? 'pointer' : 'default',
                        whiteSpace: 'nowrap', userSelect: 'none',
                        width: header.column.columnDef.size ? header.column.columnDef.size : undefined,
                      }}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <SortIcon sorted={header.column.getIsSorted()} />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  style={{ borderTop: i > 0 ? '1px solid #F0EBE4' : 'none', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FDFAF7'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} style={{ padding: '14px 20px', fontSize: 13, color: '#1A1A1A', verticalAlign: 'middle' }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {data.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px', borderTop: '1px solid #F0EBE4',
          flexWrap: 'wrap', gap: 12,
        }}>
          <p style={{ fontSize: 12, color: '#8A7F76' }}>
            {from}–{to} de {data.length} registros
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <NavBtn onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <ChevronLeft size={14} />
            </NavBtn>
            {Array.from({ length: totalPages }, (_, i) => i).map(i => (
              <NavBtn
                key={i}
                onClick={() => table.setPageIndex(i)}
                active={i === pageIndex}
              >
                {i + 1}
              </NavBtn>
            ))}
            <NavBtn onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <ChevronRight size={14} />
            </NavBtn>
          </div>
        </div>
      )}
    </div>
  )
}

function NavBtn({ onClick, disabled, active, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 32, height: 32, borderRadius: 8, border: '1px solid',
        borderColor: active ? '#CC1A1A' : '#E0D6CA',
        background: active ? '#CC1A1A' : '#FFFFFF',
        color: active ? '#FFFFFF' : disabled ? '#C4B9A8' : '#6B6560',
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 600,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  )
}
