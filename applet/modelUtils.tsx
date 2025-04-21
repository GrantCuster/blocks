import { ContentListUnion, GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: localStorage.getItem('GEMINI_API_KEY') || process.env.API_KEY });

export const predict = async ({
  contents,
}: {
  contents: ContentListUnion
}) => {
  try {
   const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents,
      config: {
        temperature: 0.6,
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    return result.candidates![0].content!.parts!;
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
};
