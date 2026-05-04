/** Escapes a cell value for CSV */
function escape(val: unknown): string {
    if (val == null) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
    }
    return str
}

/** Triggers a browser download of data as a .csv file (opens in Excel) */
export function downloadCsv(filename: string, headers: string[], rows: unknown[][]): void {
    const csvContent = [
        headers.map(escape).join(','),
        ...rows.map(row => row.map(escape).join(',')),
    ].join('\r\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}
