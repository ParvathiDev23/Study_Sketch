import * as pdfjsLib from 'pdfjs-dist';

// Use the bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

/**
 * Extract text from uploaded files
 * Supports: .pdf, .txt, .md, .doc (plain text only)
 */
export async function extractTextFromFiles(files) {
  const results = [];

  for (const file of files) {
    try {
      if (file.type === 'application/pdf') {
        const text = await extractFromPDF(file);
        results.push({ name: file.name, text, type: 'pdf' });
      } else if (
        file.type.startsWith('text/') ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.md')
      ) {
        const text = await extractFromText(file);
        results.push({ name: file.name, text, type: 'text' });
      } else if (file.type.startsWith('image/')) {
        // For images, we'll send a note that an image was uploaded
        results.push({
          name: file.name,
          text: `[Image file: ${file.name} - please analyze based on other text content]`,
          type: 'image'
        });
      } else {
        results.push({
          name: file.name,
          text: `[Unsupported file type: ${file.type}]`,
          type: 'unknown'
        });
      }
    } catch (err) {
      console.error(`Error processing ${file.name}:`, err);
      results.push({
        name: file.name,
        text: `[Error reading file: ${err.message}]`,
        type: 'error'
      });
    }
  }

  return results;
}

async function extractFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    fullText += pageText + '\n\n';
  }

  return fullText.trim();
}

async function extractFromText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
