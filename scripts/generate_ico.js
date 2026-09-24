const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Create a 32x32 RGBA image buffer for the PrepKit AI icon
const width = 32;
const height = 32;
const rgba = Buffer.alloc(width * height * 4);

// Helper to draw a pixel with alpha blending
function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const idx = (y * width + x) * 4;
  rgba[idx] = r;
  rgba[idx + 1] = g;
  rgba[idx + 2] = b;
  rgba[idx + 3] = a;
}

// Background: rounded rectangle with indigo-to-purple gradient
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    // Check if inside rounded corner (radius = 7)
    const r = 7;
    let inside = true;
    if (x < r && y < r) {
      if ((x - r) ** 2 + (y - r) ** 2 > r ** 2) inside = false;
    } else if (x >= width - r && y < r) {
      if ((x - (width - 1 - r)) ** 2 + (y - r) ** 2 > r ** 2) inside = false;
    } else if (x < r && y >= height - r) {
      if ((x - r) ** 2 + (y - (height - 1 - r)) ** 2 > r ** 2) inside = false;
    } else if (x >= width - r && y >= height - r) {
      if ((x - (width - 1 - r)) ** 2 + (y - (height - 1 - r)) ** 2 > r ** 2) inside = false;
    }

    if (inside) {
      const t = (x + y) / ((width + height) * 1.0);
      // Interpolate from #4338CA (67, 56, 202) to #9333EA (147, 51, 234)
      const red = Math.round(67 + (147 - 67) * t);
      const green = Math.round(56 + (51 - 56) * t);
      const blue = Math.round(202 + (234 - 202) * t);
      setPixel(x, y, red, green, blue, 255);
    } else {
      setPixel(x, y, 0, 0, 0, 0);
    }
  }
}

// Draw a central 4-pointed star (AI Spark)
const cx = 15.5;
const cy = 13.5;
for (let y = 4; y <= 23; y++) {
  for (let x = 6; x <= 25; x++) {
    const dx = Math.abs(x - cx);
    const dy = Math.abs(y - cy);
    // Diamond / star shape formula: (dx/a)^0.6 + (dy/b)^0.6 <= 1
    const dist = Math.pow(dx / 7.5, 0.6) + Math.pow(dy / 7.5, 0.6);
    if (dist <= 1.05) {
      const alpha = Math.min(255, Math.max(0, Math.round((1.05 - dist) * 800)));
      setPixel(x, y, 255, 255, 255, Math.max(alpha, 210));
    }
  }
}

// Draw mini checkmark at bottom right (x: 18-24, y: 20-26)
const checkPoints = [
  [18, 23], [19, 24], [20, 25], [21, 24], [22, 22], [23, 20], [24, 18]
];
for (const [px, py] of checkPoints) {
  setPixel(px, py, 52, 211, 153, 255); // Emerald check
  setPixel(px + 1, py, 52, 211, 153, 220);
}

// Minimal PNG encoder
function createPng(w, h, data) {
  function crc32(buf) {
    let table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        if (c & 1) c = 0xedb88320 ^ (c >>> 1);
        else c = c >>> 1;
      }
      table[n] = c;
    }
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function chunk(type, payload) {
    const len = payload.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    payload.copy(buf, 8);
    const crc = crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  // Raw scanlines with filter byte 0
  const scanlines = Buffer.alloc(h * (w * 4 + 1));
  let srcOffset = 0;
  let dstOffset = 0;
  for (let y = 0; y < h; y++) {
    scanlines[dstOffset++] = 0; // Filter: None
    data.copy(scanlines, dstOffset, srcOffset, srcOffset + w * 4);
    dstOffset += w * 4;
    srcOffset += w * 4;
  }

  const idatData = zlib.deflateSync(scanlines);
  const idat = chunk('IDAT', idatData);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, chunk('IHDR', ihdr), idat, iend]);
}

const pngBuf = createPng(width, height, rgba);

// Wrap PNG into ICO format (Standard modern ICO supporting PNG payloads)
const icoHeader = Buffer.alloc(6 + 16);
icoHeader.writeUInt16LE(0, 0); // Reserved
icoHeader.writeUInt16LE(1, 2); // Type: 1 = ICO
icoHeader.writeUInt16LE(1, 4); // Number of images: 1

// Directory Entry
icoHeader.writeUInt8(width, 6);        // Width
icoHeader.writeUInt8(height, 7);       // Height
icoHeader.writeUInt8(0, 8);            // Color palette
icoHeader.writeUInt8(0, 9);            // Reserved
icoHeader.writeUInt16LE(1, 10);        // Color planes
icoHeader.writeUInt16LE(32, 12);       // Bits per pixel
icoHeader.writeUInt32LE(pngBuf.length, 14); // Image size in bytes
icoHeader.writeUInt32LE(22, 18);       // Image offset (6 + 16 = 22)

const icoBuf = Buffer.concat([icoHeader, pngBuf]);

fs.writeFileSync(path.resolve(__dirname, '../client/src/app/favicon.ico'), icoBuf);
fs.writeFileSync(path.resolve(__dirname, '../client/public/favicon.ico'), icoBuf);
console.log('Successfully generated custom favicon.ico for PrepKit AI! Size:', icoBuf.length);
