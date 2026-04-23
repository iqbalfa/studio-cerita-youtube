// Helper to convert base64 to Blob, auto-detecting format
export const createAudioBlob = (base64: string, mimeType: string): Blob => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Check for RIFF header (WAV)
  if (bytes.length >= 4 && bytes[0] === 82 && bytes[1] === 73 && bytes[2] === 70 && bytes[3] === 70) {
    return new Blob([bytes], { type: 'audio/wav' });
  }
  
  // Check for ID3 header or MP3 sync word
  if ((bytes.length >= 3 && bytes[0] === 73 && bytes[1] === 68 && bytes[2] === 51) || 
      (bytes.length >= 2 && bytes[0] === 255 && (bytes[1] & 224) === 224)) {
    return new Blob([bytes], { type: 'audio/mp3' });
  }

  // Otherwise, assume it's raw PCM and wrap it in a WAV header
  let sampleRate = 24000;
  if (mimeType && mimeType.includes('rate=')) {
    const match = mimeType.match(/rate=(\d+)/);
    if (match) sampleRate = parseInt(match[1], 10);
  }

  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);
  
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + bytes.length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, bytes.length, true);
  
  return new Blob([wavHeader, bytes], { type: 'audio/wav' });
};
