"use client";
/**
 * Exportações Excel (SheetJS) e PDF (jsPDF + autotable).
 * Uso: exportExcel("relatorio", [{ name: "Aba", rows: [...] }])
 *      exportPDF("relatorio", "Título", ["Col A"], [["valor"]])
 */
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface SheetDef {
  name: string;
  rows: Record<string, unknown>[];
}

export function exportExcel(filename: string, sheets: SheetDef[]) {
  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    const ws = XLSX.utils.json_to_sheet(s.rows);
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  }
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportPDF(
  filename: string,
  titulo: string,
  head: string[],
  body: (string | number)[][],
  opts?: { landscape?: boolean; subtitulo?: string }
) {
  const doc = new jsPDF({ orientation: opts?.landscape ? "landscape" : "portrait" });
  doc.setFontSize(14);
  doc.text(titulo, 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(120);
  const gerado = `Gerado em ${new Date().toLocaleString("pt-BR")}${opts?.subtitulo ? " — " + opts.subtitulo : ""}`;
  doc.text(gerado, 14, 22);

  autoTable(doc, {
    head: [head],
    body,
    startY: 28,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 250] },
  });

  doc.save(`${filename}.pdf`);
}

/** Lê a primeira planilha de um arquivo Excel como array de objetos */
export async function readExcel(file: File): Promise<Record<string, unknown>[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf);
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: "" });
}
