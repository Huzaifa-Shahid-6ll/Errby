// Untrusted archives are parsed away from the request thread.
export const docxWorkerCode = String.raw`
const { parentPort, workerData } = require('node:worker_threads');
(async () => {
  try {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer: Buffer.from(workerData.bytes) });
    const sections = result.value.split(/\n\s*\n/).map(text => text.trim()).filter(Boolean);
    const pages = sections.map((text, index) => ({ page: index + 1, text }));
    if (pages.length > workerData.pages) throw new Error('too_many_pages');
    if (result.value.length > workerData.characters) throw new Error('too_many_characters');
    parentPort.postMessage({ pages, parser: 'mammoth/' + require('mammoth/package.json').version });
  } catch (error) {
    parentPort.postMessage({ error: ['too_many_pages', 'too_many_characters'].includes(error.message) ? error.message : 'unreadable_docx' });
  }
})();`;
