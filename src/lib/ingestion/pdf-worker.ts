import "server-only";

// A real thread lets the caller terminate CPU-heavy or damaged documents.
// Resolve inside the native worker: bundlers turn require.resolve into module IDs.
// Only server-owned limits enter this program; PDF bytes are data.
export const pdfWorkerCode = String.raw`
const { parentPort, workerData } = require('node:worker_threads');
(async () => {
  let loading;
  try {
    const moduleUrl = require('node:url').pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.mjs')).href;
    const pdfjs = await import(moduleUrl);
    loading = pdfjs.getDocument({
      data: workerData.bytes, verbosity: 0, stopAtErrors: true,
      enableXfa: false, isEvalSupported: false, useSystemFonts: false,
      useWorkerFetch: false, useWasm: false, disableFontFace: true,
    });
    const pdf = await loading.promise;
    if (await pdf.getPermissions() !== null) throw new Error('encrypted_pdf');
    if (pdf.numPages > workerData.pages) throw new Error('too_many_pages');
    const pages = [];
    let count = 0;
    for (let number = 1; number <= pdf.numPages; number++) {
      const page = await pdf.getPage(number);
      const reader = page.streamTextContent().getReader();
      let text = '';
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        for (const item of chunk.value.items) {
          if (typeof item.str !== 'string') continue;
          const part = item.str + (item.hasEOL ? '\n' : ' ');
          count += part.length;
          if (count > workerData.characters) throw new Error('too_many_characters');
          text += part;
        }
      }
      pages.push({ page: number, text: text.trim() });
      page.cleanup();
    }
    const metadata = await pdf.getMetadata();
    const metadataText = JSON.stringify(metadata.info || {});
    const metadataWarning = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\b(?:\+?\d[\d ()-]{7,}\d)\b/i.test(metadataText) ||
      !!(metadata.info?.Author || metadata.info?.Creator);
    parentPort.postMessage({ pages, parser: 'pdfjs-dist/' + pdfjs.version, metadataWarning });
  } catch (error) {
    const known = ['encrypted_pdf', 'too_many_pages', 'too_many_characters'];
    parentPort.postMessage({ error: error.name === 'PasswordException' ? 'encrypted_pdf' :
      known.includes(error.message) ? error.message : 'unreadable_pdf' });
  } finally {
    if (loading) await loading.destroy();
  }
})();
`;
