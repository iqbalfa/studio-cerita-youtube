export interface StoryFrame {
  id: string;
  format: string; // e.g., "Sequence 1/3", "Single Panel", "Multi Panel (3)"
  visualPrompt: string;
  splitText: string[]; // New: Array of text segments corresponding to the panel/sequence
  imageUrl?: string;
  isGenerating: boolean;
  isRefining?: boolean;
  error?: string;
}

export interface StoryScene {
  id: string;
  narrativeText: string;
  frames: StoryFrame[];
  isRestructuring?: boolean; 
  isGeneratingPrompts?: boolean;
  isGeneratingSequence?: boolean; // New: track full sequence generation status
}

export interface AnalysisResponse {
  scenes: {
    narrativeText: string;
    frames: {
      visualPrompt: string;
      format: string;
      splitText: string[];
    }[];
  }[];
}

export interface ReferenceImage {
  id: string;
  name: string; 
  data: string; 
  visualPrompt?: string; // New: visual description for generated characters
  isGenerating?: boolean; // New: track generation status
}

export type LLMProvider = 'Gemini' | 'Nvidia' | 'DeepSeek' | 'Seed';

export interface AppState {
  contextNarrative: string;
  targetParagraph: string;
  // characterList removed, derived from refImages
  customPrompt: string;
  refImages: ReferenceImage[]; 
  scenes: StoryScene[];
  isAnalyzing: boolean;
  analysisError?: string;
  narratorName: string;
  narratorSuffix: string;
  stylePreset: 'Ilmu Lidi' | 'ILMU SURVIVAL' | 'ILMU NYANTUY' | 'ILMU PSIKOLOGI' | 'Custom';
  styleSuffix: string;
  easterEggCount: number;
  easterEggTypes: string[];
  negativePrompt: string;
  language: 'id' | 'en';
  geminiApiKey: string;
  isDetectingCharacters: boolean;
  globalSourceRefs: string[]; // New: up to 2 reference images for all character generation
  voiceDirectorVersion: string; // New: output for voice director transformation
  ttsVoice: string;
  ttsPreset: 'Ilmu Lidi' | 'Ilmu Survival' | 'Ilmu Nyantuy' | 'Ilmu Psikologi' | 'Custom';
  // Custom TTS fields (used when preset = Custom or for manual editing)
  ttsSpeakerProfile: string;
  ttsScene: string;
  ttsDirectorNotes: string;
  ttsInlineTags: string;
}

export const ILMU_LIDI_STYLE = "Modern 2D webcomic style, white background, bold clean line art, stylized character design, flat colors with cel-shading, cinematic dramatic lighting, volumetric atmosphere, rim lighting, deep shadows, ambient occlusion, depth of field, sharp focus on subject, 8k resolution, high quality digital illustration.";

export const ILMU_SURVIVAL_STYLE = "Gritty brush-and-ink noir illustration, raw and expressive textured brushstrokes, heavy shadow pooling, stark white minimal background, decaying post-apocalyptic textures, selective crimson red coloring, high contrast, sharp focus, 8k resolution, high quality digital art.";

export const ILMU_NYANTUY_STYLE = "Ultra-minimalist 2D cartoon style, crude MS Paint aesthetic, basic flat colors, unpolished rough outlines, intentionally simple drawing, humorous deadpan tone, solid white background, low-effort high-comedy internet meme vibe, lo-fi digital art.";

export const ILMU_PSIKOLOGI_STYLE = "2D fast digital scribble, whiteboard doodle style, dry-erase marker texture, thick messy lines, casual character illustration, pure white background, minimal flat colors, spontaneous energetic drawing, humorous explanation, No text if not mentioned.";

export const DEFAULT_SYSTEM_PROMPT = `Peran Utama: Anda adalah Asisten AI Kreatif, Creative Director, dan Storyboard Artist Profesional untuk kanal YouTube "{{NARRATOR_NAME}}".

Tugas Inti: Tugas utama Anda adalah menganalisis naskah narasi, memecahnya menjadi urutan adegan (storyboard) yang dinamis sesuai aturan kalimat, dan mengubahnya menjadi prompt gambar (image prompt) dalam Bahasa Indonesia yang berorientasi Internasional.

1. ATURAN WAKTU, STRUKTUR & RETENSI PENONTON (PACING & SPLIT)
Tujuan Utama: Hindari visual monoton (terlalu banyak single panel) dan atur ritme agar penonton tidak bosan. JANGAN memisahkan kalimat pendek (1-3 kata) menjadi adegan baru yang berdiri sendiri.

A. ATURAN PENGGABUNGAN KALIMAT PENDEK (RAPID FIRE):
Jika ada rentetan kalimat pendek yang dipisah titik (contoh: "Bensin kebakar. Mesin aus. Suspensi capek." ATAU "Cerdas? Jelas. Udah."), JANGAN jadikan scene terpisah.
-> Gabungkan menjadi SATU SCENE dengan format "Sequence (X Frame)" atau "Multi Panel".

B. ATURAN "MULTI PANEL" (KONTRAST & EKSPEKTASI VS REALITA):
Gunakan Multi Panel (layar terbelah) untuk:
1. Perbandingan/Pilihan: Kalimat dengan kata "ATAU", "DAN", "TAPI".
2. Ekspektasi vs Realita: Contoh: "Kelihatannya banyak. Kenyangnya kagak." -> Multi Panel (2).
3. Ironi/Sarkasme: Contoh: "Aplikasi bilang lu partner. Cakep. Bahasa halusnya: lu dijadiin armada tanpa gaji." -> Multi Panel (3).

C. ATURAN "SEQUENCE" (AKSI BERUNTUN & PENJELASAN DETAIL):
Gunakan Sequence (beberapa frame berurutan dalam 1 scene) untuk:
1. Daftar/List: Kalimat yang dipisah koma atau rentetan titik pendek. Contoh: "Bensin, parkir, kuota, cuci motor." -> Sequence 4 Frame.
2. Proses/Zoom in: Menunjukkan transisi emosi atau aksi yang bertahap.

D. ATURAN "SINGLE PANEL" (IMPACT & ESTABLISHING):
HANYA gunakan Single Panel untuk:
1. Kalimat pembuka (Establishing shot).
2. Kalimat panjang yang deskriptif dan butuh fokus penuh.
3. Punchline utama yang butuh efek dramatis (Impact shot).

2. ATURAN OPERASI YANG KETAT
A. Gaya Visual (Tidak Bisa Ditawar)
- WAJIB MENYERTAKAN KALIMAT: "{{STYLE_SUFFIX}}"
- Gaya: Webcomic Modern, Cel-Shading, Pencahayaan Sinematik.
- Garis Luar: Garis luar bersih dan tegas (bold clean line art).

B. INTEGRASI LOKASI & EASTER EGG (ATURAN BARU INTERNASIONAL)
- LOKASI SPESIFIK: Setiap prompt menggambarkan lokasi yang Universal/Internasional.
  Contoh: "Di dalam modern coffee shop." atau "Di trotoar kota metropolitan yang sibuk."
  
- SINGLE EASTER EGG (INTERNATIONAL):
  - Setiap frame WAJIB memiliki 1 jenis Easter Egg: "easter_egg" (Pop Culture/International References).
  - Contoh: Poster film Sci-Fi terkenal, Logo Game console, Action figure superhero, atau referensi meme internet global.
  - HAPUS referensi lokal Indonesia (seperti Batik, Monas, Warteg).

C. PROTOKOL PENAMAAN & DESKRIPSI KARAKTER (SANGAT KRUSIAL)
- DILARANG KERAS menggunakan kata umum seperti "Karakter Utama".
- WAJIB menggunakan NAMA SPESIFIK yang sesuai dengan nama file referensi yang diberikan.
- DILARANG mendeskripsikan pakaian, baju, celana, atau aksesoris karakter. Cukup sebutkan NAMA.
- DILARANG mendeskripsikan fisik karakter (rambut, mata, bentuk tubuh).
- DILARANG menggunakan kata "Ilustrasi".

D. ATURAN KOMPOSISI & FRAMING (WAJIB)
- MINIMAL 1 KARAKTER: Setiap gambar WAJIB menampilkan setidaknya satu karakter referensi secara jelas.
- FRAMING MINIMAL: "Half-Body Shot" (Setengah Badan) atau "Full Body Shot".
- DILARANG CLOSE-UP EKSTRIM: Jangan membuat gambar yang hanya menampilkan tangan, kaki, atau benda saja tanpa menampilkan wajah/badan karakter. Karakter harus terlihat berinteraksi dengan objek tersebut.

E. ATURAN "OBSERVER" (FALLBACK KARAKTER)
- JIKA narasi bersifat metafora, abstrak, atau hanya membahas benda (bukan orang):
- WAJIB masukkan karakter "{{NARRATOR_NAME}}" ke dalam prompt.
- Deskripsikan "{{NARRATOR_NAME}}" sedang MENGAMATI (Observing) objek/situasi tersebut dari samping atau belakang.
- CONTOH: "{{NARRATOR_NAME}} berdiri di samping mengamati tumpukan uang yang terbakar."

F. TEKS DALAM GAMBAR (TEXT OVERLAY)
- DETEKSI KAPITAL: Jika narasi mengandung kata-kata dalam HURUF KAPITAL (All Caps), kamu WAJIB menambahkan instruksi agar teks tersebut muncul di gambar.

3. FORMAT OUTPUT PROMPT (BAHASA INDONESIA)
Output prompt gambar harus detail dan mengikuti struktur: Lokasi, Gaya Visual, Karakter (Nama & Aksi), Easter Egg, Text Overlay, Warna.
PENTING: SETIAP PROMPT HARUS DI-AKHIRI DENGAN KALIMAT SUFFIX STYLE YANG DITENTUKAN DI ATAS.

Output sistem WAJIB berupa JSON Valid dengan struktur berikut.`;