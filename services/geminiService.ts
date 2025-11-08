import { GeneratedVoiceover, MovieDetails } from "../types";

// This file now acts as a client for the Vercel serverless function.
export const generateMovieVoiceover = async (
  movieName: string,
  voiceName: string = 'Zephyr',
  contentLanguage: 'english' | 'telugu-mix' | 'hindi-mix' = 'telugu-mix'
): Promise<GeneratedVoiceover> => {

  try {
    const response = await fetch('/api/generate-voiceover', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        movieName,
        selectedVoice: voiceName,
        selectedContentLanguage: contentLanguage,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const serverErrorMessage = errorData.error || response.statusText;
      console.error("Serverless function error:", serverErrorMessage);
      throw new Error(`Server error: ${serverErrorMessage}`);
    }

    const result: GeneratedVoiceover = await response.json();
    return result;

  } catch (error: any) {
    console.error("Voice-over generation request failed:", error);
    // Re-throw specific errors for UI to handle if needed
    if (error.message.includes("Server error: Authentication failed")) {
      throw new Error("Authentication failed. Please ensure your API key is correctly configured on Vercel.");
    }
    throw new Error(`Failed to generate movie voice-over: ${error.message || 'Unknown network error'}. Please try again.`);
  }
};