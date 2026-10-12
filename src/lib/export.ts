import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export interface Sheet {
  name: string;
  headers: string[];
  rows: (string | number)[][];
}

export function exportPDF(title: string, sheets: Sheet[], file: string) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(18);
  doc.text(title, 14, 16);
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date().toLocaleString("es-GT")}`, 14, 22);
  let y = 28;
  sheets.forEach((s) => {
    doc.setFontSize(12);
    doc.text(s.name, 14, y);
    autoTable(doc, {
      startY: y + 3,
      head: [s.headers],
      body: s.rows.map((r) => r.map(String)),
      headStyles: { fillColor: [30, 58, 138] },
      styles: { fontSize: 8 },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 12;
  });
  doc.save(`${file}.pdf`);
}

export function exportXLSX(sheets: Sheet[], file: string) {
  const wb = XLSX.utils.book_new();
  sheets.forEach((s) => {
    const ws = XLSX.utils.aoa_to_sheet([s.headers, ...s.rows]);
    ws["!cols"] = s.headers.map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  });
  XLSX.writeFile(wb, `${file}.xlsx`);
}

export function exportCSV(sheets: Sheet[], file: string) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = sheets
    .map((s) => [s.name, s.headers.map(esc).join(","), ...s.rows.map((r) => r.map(esc).join(","))].join("\n"))
    .join("\n\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${file}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
