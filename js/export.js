// export.js - PDF export and shareable link encoding

// Detect environment
const isBrowser = typeof window !== 'undefined';

// --- compressData ---
// JSON.stringify → compress (pako in browser, zlib in Node) → base64url
export async function compressData(reportData) {
  const json = JSON.stringify(reportData);

  let compressed;
  if (isBrowser) {
    // pako must be available globally in the browser
    compressed = pako.deflate(json);
  } else {
    const zlib = await import('node:zlib');
    const encoder = new TextEncoder();
    const bytes = encoder.encode(json);
    compressed = zlib.deflateSync(bytes);
  }

  // Convert Uint8Array / Buffer to base64
  const binaryStr = Array.from(compressed)
    .map((b) => String.fromCharCode(b))
    .join('');
  const base64 = btoa(binaryStr);

  // Convert to base64url (replace +→-, /→_, strip trailing =)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// --- decompressData ---
// base64url → standard base64 → Uint8Array → inflate → JSON.parse
export async function decompressData(encoded) {
  // Restore standard base64 padding
  let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad === 2) base64 += '==';
  else if (pad === 3) base64 += '=';

  // base64 → binary bytes
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  let decompressed;
  if (isBrowser) {
    decompressed = pako.inflate(bytes);
  } else {
    const zlib = await import('node:zlib');
    decompressed = zlib.inflateSync(bytes);
  }

  const decoder = new TextDecoder();
  const json = decoder.decode(decompressed);
  return JSON.parse(json);
}

// --- encodeShareData ---
// Compress reportData and append as URL hash
export async function encodeShareData(reportData) {
  const hash = await compressData(reportData);
  if (isBrowser) {
    const url = new URL(window.location.href);
    url.hash = hash;
    return url.toString();
  }
  // In Node (testing) just return the hash with a leading #
  return `#${hash}`;
}

// --- decodeShareData ---
// Strip leading # from hash, then decompress
export async function decodeShareData(hash) {
  const encoded = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!encoded) return null;
  return decompressData(encoded);
}

// --- generatePDF ---
// Browser-only: uses html2canvas + jsPDF
export async function generatePDF(reportData) {
  if (!isBrowser) {
    console.log('PDF export is only available in the browser');
    return;
  }

  const element = document.getElementById('report-content');
  if (!element) {
    console.warn('generatePDF: #report-content not found');
    return;
  }

  // Capture with html2canvas
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#f8fafc',
  });

  // A4 dimensions in mm
  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;

  // jsPDF in portrait A4
  // eslint-disable-next-line new-cap
  const pdf = new jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidthPx = canvas.width;
  // How many source pixels correspond to one A4 page height?
  const pageHeightPx = Math.floor((canvas.width * A4_HEIGHT_MM) / A4_WIDTH_MM);

  const totalPages = Math.ceil(canvas.height / pageHeightPx);

  if (totalPages <= 1) {
    // Fits in a single page
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM);
  } else {
    // Slice into page-sized chunks
    for (let page = 0; page < totalPages; page++) {
      const srcY = page * pageHeightPx;
      const srcH = Math.min(pageHeightPx, canvas.height - srcY);

      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = pageWidthPx;
      sliceCanvas.height = pageHeightPx;

      const ctx = sliceCanvas.getContext('2d');
      ctx.drawImage(canvas, 0, srcY, pageWidthPx, srcH, 0, 0, pageWidthPx, srcH);

      const sliceData = sliceCanvas.toDataURL('image/png');

      if (page > 0) pdf.addPage();
      pdf.addImage(sliceData, 'PNG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM);
    }
  }

  // Build filename with current date
  const date = reportData?.meta?.dateStr || new Date().toISOString().slice(0, 10);
  pdf.save(`battery-report-${date}.pdf`);
}
