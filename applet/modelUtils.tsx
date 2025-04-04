import { ContentListUnion, GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: localStorage.getItem('API_KEY') || process.env.API_KEY });

export const predict = async ({
  contents,
}: {
  contents: ContentListUnion
}) => {
  console.log(contents);
  try {
   const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: contents,
      config: {
        temperature: 0.6,
        responseModalities: ["TEXT", "IMAGE"],
      },
    });
    console.log(result.text);

    return [];
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
};
