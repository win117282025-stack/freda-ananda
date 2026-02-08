import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

// Initialize strictly with process.env.API_KEY as per instructions
if (process.env.API_KEY) {
  client = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const generateAiResponse = async (userMessage: string, context: string): Promise<string> => {
  if (!client) return "Maaf, kunci API Gemini tidak ditemukan.";

  try {
    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Kamu adalah asisten AI di dalam game bernama "Obby Nusantara 3D". 
        Konteks Game: ${context}.
        Gaya bicara: Seru, membantu, singkat, dan menggunakan bahasa Indonesia gaul tapi sopan.
        
        Pertanyaan User: ${userMessage}
      `,
    });
    return response.text || "Hmm, aku bingung mau jawab apa.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Maaf, aku lagi pusing (Error koneksi AI).";
  }
};
