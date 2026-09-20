import { useRef, useState } from "react";
// O xlsx tem ~900KB: só é baixado quando alguém abre uma planilha de fato.
// O import de tipo é apagado na compilação e não puxa o pacote.
import type * as XLSXTypes from "xlsx";
import { TemplateError, parseTemplate, type Template } from "@/lib/template";

type ImportModalProps = {
  readonly onClose: () => void;
  readonly onLoaded: (template: Template) => void;
};

export function ImportModal({ onClose, onLoaded }: ImportModalProps) {
  const [status, setStatus] = useState("");
  const [fileLabel, setFileLabel] = useState("Escolher arquivo");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setFileLabel(file.name);
    setStatus("Processando…");

    try {
      const XLSX = await import("xlsx");
      const ext = file.name.split(".").pop()?.toLowerCase();
      const buf = await file.arrayBuffer();
      let workbook: XLSXTypes.WorkBook;
      if (ext === "csv") {
        // Excel pt-BR saves CSV as Windows-1252; raw keeps "01234567890" as text.
        let text: string;
        try {
          text = new TextDecoder("utf-8", { fatal: true }).decode(buf);
        } catch {
          text = new TextDecoder("windows-1252").decode(buf);
        }
        workbook = XLSX.read(text, { type: "string", raw: true });
      } else {
        workbook = XLSX.read(buf, { type: "array" });
      }
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet?.["!ref"]) throw new Error("Planilha vazia.");
      // Start the range at A1 so row/column indexes match the original sheet.
      const range = XLSX.utils.decode_range(sheet["!ref"]);
      range.s = { r: 0, c: 0 };
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false, range }) as unknown[][];

      const template = parseTemplate(file.name, rows);
      onLoaded(template);

      const cols = [["Nome", template.nameCol], ["CPF", template.cpfCol], ["Estado", template.ufCol]]
        .filter(([, c]) => c !== -1)
        .map(([n]) => n)
        .join(", ");
      setStatus(`Modelo carregado. Colunas preenchidas no export: ${cols}.`);
      setTimeout(onClose, 1500);
    } catch (err) {
      if (!(err instanceof TemplateError)) console.error(err);
      setStatus("Erro ao ler a planilha: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 grid place-items-center bg-[rgb(28_31_28/0.4)] p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-title"
        className="flex w-[min(520px,100%)] flex-col overflow-hidden rounded-lg border border-line-strong bg-surface shadow-[var(--shadow-md)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line py-3 pr-2 pl-4">
          <div className="text-[18px] font-bold text-ink" id="import-title">
            Planilha modelo
          </div>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent p-0 text-muted transition-[background-color,border-color,color] duration-120 hover:bg-surface-alt hover:text-ink active:bg-line"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" className="block flex-none"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
          </button>
        </div>
        <div className="flex flex-col gap-3 p-4 text-[15px]">
          <p className="m-0">
            Envie uma planilha (.xlsx, .xls ou .csv) para servir de modelo. Ao <strong>Exportar</strong>, os resultados
            da tabela são gravados nela, no mesmo layout.
          </p>
          <ul className="m-0 flex list-disc flex-col gap-1 pl-[1.2em] text-muted [&_strong]:text-ink">
            <li>
              Colunas reconhecidas: <strong>Nome</strong> (ou &quot;Nome Completo&quot;, &quot;Cliente&quot;),{" "}
              <strong>CPF</strong> (ou &quot;Nº CPF&quot;, &quot;Documento&quot;) e <strong>Estado</strong> (ou
              &quot;UF&quot;). Maiúsculas, acentos e pontuação são ignorados, e o cabeçalho pode estar em qualquer uma
              das 10 primeiras linhas.
            </li>
            <li>Só essas colunas são preenchidas. Nenhuma coluna é criada, e as demais ficam como estão.</li>
            <li>
              Linhas que já têm dados recebem os resultados da tabela, em ordem, só nas células vazias. Os resultados
              que sobrarem viram linhas novas no fim.
            </li>
            <li>O modelo fica ativo até você removê-lo, inclusive ao gerar novos CPFs.</li>
          </ul>
          <label className="relative inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-line-strong bg-surface px-4 text-[15px] leading-[1.2] font-semibold text-ink shadow-[var(--shadow-sm)] transition-[background-color,border-color,color] duration-120 hover:bg-surface-alt active:bg-line">
            <span>{fileLabel}</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="absolute inset-0 w-full cursor-pointer opacity-0"
            />
          </label>
          <p
            role="status"
            className={`m-0 min-h-[1.4em] text-[14px] font-semibold ${
              status.startsWith("Erro") ? "text-danger" : "text-accent"
            }`}
          >
            {status}
          </p>
        </div>
      </div>
    </div>
  );
}
