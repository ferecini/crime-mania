/** Mensagens técnicas (pdf.js, Node) → português para a UI admin. */
export function humanizeDossierProcessingError(raw: string): string {
  const msg = raw.trim();
  if (!msg) return "Falha no processamento do PDF.";
  if (/Setting up fake worker failed/i.test(msg) || /pdf\.worker\.mjs/i.test(msg)) {
    return "Motor PDF indisponível no servidor. Tente novamente após o deploy ou use o processador automático (GitHub Actions).";
  }
  if (/Cannot find module/i.test(msg)) {
    return "Dependência de PDF ausente no ambiente de produção. Contate suporte técnico.";
  }
  if (/\.resolve is not a function/i.test(msg)) {
    return "Motor PDF não pôde iniciar no servidor. Aguarde o deploy mais recente ou use o processador automático (GitHub Actions).";
  }
  if (/Timeout ao ler PDF/i.test(msg)) return msg;
  if (/PDF criptografado/i.test(msg)) return msg;
  if (/excede/i.test(msg)) return msg;
  if (/Extração HTML:/i.test(msg)) return msg.replace(/^Extração HTML:\s*/i, "Extração do documento: ");
  return msg;
}
