const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const width = 32;
const height = 32;
const rgba = Buffer.alloc(width * height * 4);

function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const idx = (y * width + x) * 4;
  rgba[idx] = r;
  rgba[idx + 1] = g;
  rgba[idx + 2] = b;
  rgba[idx + 3] = a;
}

// Background: rounded squircle with indigo-to-purple gradient
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
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
      const red = Math.round(79 + (124 - 79) * t);
      const green = Math.round(70 + (58 - 70) * t);
      const blue = Math.round(229 + (237 - 229) * t);
      setPixel(x, y, red, green, blue, 255);
    } else {
      setPixel(x, y, 0, 0, 0, 0);
    }
  }
}

// Draw Tutor Graduation Cap (Mortarboard top diamond)
const cx = 15.5;
const cy = 13.5;
for (let y = 7; y <= 20; y++) {
  for (let x = 3; x <= 28; x++) {
    const dx = Math.abs(x - cx);
    const dy = Math.abs(y - cy);
    // Diamond equation: dx/12 + dy/6.5 <= 1
    if (dx / 12.5 + dy / 6.5 <= 1.0) {
      setPixel(x, y, 255, 255, 255, 255);
    }
  }
}

// Skullcap base (headband)
for (let y = 16; y <= 22; y++) {
  for (let x = 9; x <= 22; x++) {
    const dx = Math.abs(x - cx);
    if (dx <= 6.5) {
      setPixel(x, y, 240, 244, 255, 255);
    }
  }
}

// Tassel (cyan accent)
const tasselPoints = [
  [16, 13], [19, 14], [22, 15], [24, 16],
  [25, 17], [25, 18], [25, 19], [25, 20], [25, 21], [25, 22], [24, 23], [26, 23]
];
for (const [px, py] of tasselPoints) {
  setPixel(px, py, 56, 189, 248, 255);
}

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
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(6, 9);
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const scanlines = Buffer.alloc(h * (w * 4 + 1));
  let srcOffset = 0;
  let dstOffset = 0;
  for (let y = 0; y < h; y++) {
    scanlines[dstOffset++] = 0;
    data.copy(scanlines, dstOffset, srcOffset, srcOffset + w * 4);
    dstOffset += w * 4;
    srcOffset += w * 4;
  }

  const idat = chunk('IDAT', zlib.deflateSync(scanlines));
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, chunk('IHDR', ihdr), idat, iend]);
}

const pngBuf = createPng(width, height, rgba);
const icoHeader = Buffer.alloc(6 + 16);
icoHeader.writeUInt16LE(0, 0);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(1, 4);
icoHeader.writeUInt8(width, 6);
icoHeader.writeUInt8(height, 7);
icoHeader.writeUInt8(0, 8);
icoHeader.writeUInt8(0, 9);
icoHeader.writeUInt16LE(1, 10);
icoHeader.writeUInt16LE(32, 12);
icoHeader.writeUInt32LE(pngBuf.length, 14);
icoHeader.writeUInt32LE(22, 18);

const icoBuf = Buffer.concat([icoHeader, pngBuf]);
fs.writeFileSync(path.resolve(__dirname, '../client/src/app/favicon.ico'), icoBuf);
fs.writeFileSync(path.resolve(__dirname, '../client/public/favicon.ico'), icoBuf);
console.log('Successfully generated tutor favicon.ico!');
