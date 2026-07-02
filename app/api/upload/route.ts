/**
 * Upload de arquivos (atestados, documentos, restauração de backup).
 * Os arquivos são gravados em public/uploads e servidos estaticamente.
 */
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo ausente" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Arquivo maior que 10 MB" }, { status: 413 });
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // nome seguro e único
  const limpo = file.name.replace(/[^a-zA-Z0-9à-ÿÀ-Ÿ._-]/g, "_").slice(-80);
  const nome = `${Date.now().toString(36)}-${limpo}`;
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(dir, nome), buf);

  return NextResponse.json({ path: `/uploads/${nome}`, nome: file.name });
}
