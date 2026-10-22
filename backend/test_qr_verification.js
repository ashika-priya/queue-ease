const QRCode = require('qrcode');
const jsQR = require('jsqr');
const { PNG } = require('pngjs');

async function testQR() {
  console.log('Testing QR Code Generation & Raw Pixel Image Decoding...');
  const sampleUrl = 'http://localhost:3000/join/org123/srv456';
  
  const pngBuffer = await QRCode.toBuffer(sampleUrl, { type: 'png', width: 300, margin: 2 });
  console.log(`✓ QRCode PNG buffer generated (${pngBuffer.length} bytes)`);

  const png = PNG.sync.read(pngBuffer);
  console.log(`✓ PNG parsed: dimensions ${png.width}x${png.height}`);

  const code = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  if (!code) {
    throw new Error('Failed to decode QR code');
  }

  console.log(`✓ jsQR successfully decoded payload: "${code.data}"`);
  if (code.data === sampleUrl) {
    console.log('✓ MATCH VERIFIED: Decoded QR exactly matches encoded URL!');
  } else {
    throw new Error('Payload mismatch');
  }
}

testQR().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
