/**
 * Backup e restauração do banco.
 *  GET    → download do db.json completo
 *  POST   → restaura a partir de um JSON enviado
 *  DELETE → reseta para os dados de demonstração (seed)
 */
import { NextRequest, NextResponse } from "next/server";
import { audit, getDB, resetDB, restoreDB, writeDB } from "@/database/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDB();
  return new NextResponse(JSON.stringify(db, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="backup-rh-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}

export async function POST(req: NextRequest) {
  const usuario = req.headers.get("x-user") ?? "desconhecido";
  try {
    const json = await req.json();
    restoreDB(json);
    const db = getDB();
    audit(db, usuario, "restaurar", "banco", "-", "Backup restaurado");
    writeDB(db);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Backup inválido" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const usuario = req.headers.get("x-user") ?? "desconhecido";
  const db = resetDB();
  audit(db, usuario, "restaurar", "banco", "-", "Banco resetado para dados de demonstração");
  writeDB(db);
  return NextResponse.json({ ok: true });
}
