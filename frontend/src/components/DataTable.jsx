import { Edit, Trash2, Eye } from 'lucide-react';

const DataTable = ({ columns, data, onEdit, onDelete, onView, emptyMessage = 'Aucune donnée disponible' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-muted bg-surface rounded-xl border border-border-light">
        <svg className="w-12 h-12 mb-3 text-border-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-sm font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border-light bg-surface card-shadow">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-background border-b border-border-light">
            {columns.map((col, i) => (
              <th key={i} className="px-6 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                {col.header}
              </th>
            ))}
            {(onView || onEdit || onDelete) && (
              <th className="px-6 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light">
          {data.map((row, rowIndex) => (
            <tr key={row.id || rowIndex} className="hover:bg-background/50 transition-colors">
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="px-6 py-4 text-sm text-text-main whitespace-nowrap">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
              {(onView || onEdit || onDelete) && (
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-3">
                    {onView && (
                      <button
                        onClick={() => onView(row)}
                        className="p-1.5 rounded-lg text-secondary hover:bg-secondary/10 transition-colors"
                        title="Voir les détails"
                      >
                        <Eye size={18} />
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(row)}
                        className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                        title="Modifier"
                      >
                        <Edit size={18} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(row)}
                        className="p-1.5 rounded-lg text-danger hover:bg-danger/10 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
