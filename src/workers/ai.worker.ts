// src/workers/ai.worker.ts
import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;

// OPTIMASI: Batasi penggunaan thread agar browser tidak hang saat proses berat
env.backends.onnx.wasm.numThreads = 1; 

let extractor: any = null;
let initPromise: Promise<any> | null = null; // KUNCI UTAMA: Gembok (Lock) Antrean

const initAI = async () => {
  // Jika sedang ada proses memuat model yang berjalan, tunggu sampai selesai!
  // Jangan biarkan note lain membuat proses muat yang baru.
  if (initPromise) {
    await initPromise;
    return;
  }

  if (!extractor) {
    console.log("🤖 Memuat Model AI ke browser (Hanya 1x seumur hidup)...");
    
    // Kunci pintunya dengan Promise
    initPromise = new Promise(async (resolve, reject) => {
      try {
       // Di dalam src/workers/ai.worker.ts
// Ubah 'Xenova/all-MiniLM-L6-v2' menjadi versi multilingual:

        extractor = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2', {
            progress_callback: (x: any) => {
                self.postMessage({ type: 'PROGRESS', data: x });
            }
        });

        console.log("✅ Otak AI Lokal Siap Tempur!");
        resolve(true);
      } catch (err: any) {
        self.postMessage({ type: 'ERROR', error: err.message });
        reject(err);
      }
    });

    await initPromise;
  }
};

self.onmessage = async (event) => {
  const { type, text, noteId } = event.data;

  if (type === 'GENERATE_EMBEDDING') {
    try {
      // Semua note akan rapi mengantre di sini jika model belum siap
      await initAI(); 
      console.log(`🤖 Menganalisis makna ID: ${noteId.substring(0,6)}...`);
      
      const output = await extractor(text, { pooling: 'mean', normalize: true });
      const embeddingArray = Array.from(output.data); 
      
      self.postMessage({ type: 'RESULT', noteId, embedding: embeddingArray });
    } catch (error: any) {
      console.error("❌ AI Gagal:", error);
      self.postMessage({ type: 'ERROR', error: error.message });
    }
  }
};