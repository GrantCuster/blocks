import {
  GoogleGenerativeAI,
  GenerateContentRequest,
} from "@google/generative-ai";

export const predict = async ({
  contents,
}: {
  contents: GenerateContentRequest;
}) => {
  const genAI = new GoogleGenerativeAI(
    "PUT KEY HERE"
  );

  try {
    const result = await genAI
      .getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        generationConfig: {
          temperature: 0.6,
          responseModalities: ["Text", "Image"],
        },
      })
      .generateContent(contents);
    const response = result.response;

    return response.candidates![0].content.parts;
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
};
