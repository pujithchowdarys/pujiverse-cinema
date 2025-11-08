import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import { GeneratedVoiceover, MovieDetails } from "../types";

// Helper function to get geolocation, if available.
// This is added because googleMaps grounding might benefit from it,
// though not strictly used in this specific prompt with googleSearch.
// It's a good practice to include it if location-aware features might be added later.
async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } else {
      console.warn("Geolocation is not supported by this browser.");
      resolve(null);
    }
  });
}

// Schema for extracting movie details
const movieDetailsSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'The exact title of the movie.' },
    cast: { type: Type.STRING, description: 'Main actors and actresses in the movie, comma-separated.' },
    releaseDate: { type: Type.STRING, description: 'The release date of the movie, e.g., "July 10, 2015".' },
    director: { type: Type.STRING, description: 'The director(s) of the movie, comma-separated.' },
    production: { type: Type.STRING, description: 'The production company of the movie.' },
    grossProfit: { type: Type.STRING, description: 'The estimated gross profit of the movie, including currency.' },
  },
  required: ['title', 'cast', 'releaseDate', 'director', 'production', 'grossProfit'],
  propertyOrdering: ['title', 'cast', 'releaseDate', 'director', 'production', 'grossProfit'],
};

export const generateMovieVoiceover = async (
  movieName: string,
  voiceName: string = 'Zephyr',
  contentLanguage: 'english' | 'telugu-mix' | 'hindi-mix' = 'telugu-mix'
): Promise<GeneratedVoiceover> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let systemInstruction: string;
  let prompt: string;
  let voiceoverLanguageDescription: string;
  let languageHashtag: string;
  let languageTag: string;

  const cleanedMovieName = movieName.replace(/\s+/g, ' '); // Clean up multiple spaces

  switch (contentLanguage) {
    case 'english':
      systemInstruction = `You are an expert movie commentator for Pujiverse Cinema. Your primary goal is to create an engaging voice-over script in pure English, similar to how an Indian movie analyst would discuss a film, integrating common movie industry terms.`;
      prompt = `
Provide a detailed voice-over script for the movie "${cleanedMovieName}". The script should be continuous, without any headings, bolding, italics, or markdown formatting.

1.  **Movie Introduction**: Start with "Hello everyone! Welcome to Pujiverse Cinema with me, Pujith Sakhamuri. Today in this video, we are going to discuss the movie ${cleanedMovieName} in detail."
2.  **Movie Details**: Clearly explain the Movie Title, Cast, Release date, Director, Production company, and Gross profit. Do not use headings or labels; present this information naturally within the text.
3.  **Plot Summary**: Describe the entire plot of the movie, from beginning to end, in great detail. Incorporate English movie terms for concepts like 'plot twist', 'character arc', 'visual effects', 'climax', 'flashback', 'protagonist', 'antagonist', 'sequel', etc.
4.  **Conclusion**: Conclude with "If you liked the video, please like, share, and subscribe to my channel Pujiverse Cinema and hit the bell icon to get more latest updates of my videos."
`;
      voiceoverLanguageDescription = "English";
      languageHashtag = `#EnglishMovies`;
      languageTag = `English cinema, English movie analysis`;
      break;

    case 'hindi-mix':
      systemInstruction = `You are an expert movie commentator for Pujiverse Cinema. Your primary goal is to create an engaging voice-over script. The script should be primarily in Hindi, but seamlessly and *frequently* integrate English words for concepts or terms that are either difficult to translate accurately, commonly used in the film industry (e.g., 'plot twist', 'flashback', 'climax', 'protagonist', 'antagonist', 'sequel', 'visual effects', 'box office collection', 'release date', 'director', 'production house'), or generally better understood in English.`;
      prompt = `
मैं आपको एक फिल्म का नाम दूंगा, उसके लिए एक विस्तृत voice-over script तैयार करें। स्क्रिप्ट एक निरंतर स्क्रिप्ट होनी चाहिए, जिसमें कोई शीर्षक, बोल्डिंग, इटैलिक्स या मार्कडाउन फ़ॉर्मेटिंग न हो।

1.  **फिल्म परिचय**: "नमस्ते दोस्तों! Pujith Sakhamuri के साथ Pujiverse Cinema चैनल में आपका स्वागत है। इस वीडियो में, हम फिल्म ${cleanedMovieName} के बारे में विस्तार से चर्चा करेंगे।" से शुरू करें।
2.  **फिल्म विवरण**: फिल्म का शीर्षक (Movie Title), कलाकार (Cast), रिलीज की तारीख (Release date), निर्देशक (Director), प्रोडक्शन कंपनी (Production company), और कुल लाभ (Gross profit) - इन सभी विवरणों को हिंदी में स्पष्ट रूप से समझाएं। आवश्यकतानुसार English terms का उपयोग करें (उदाहरण के लिए, 'movie title', 'cast', 'release date', 'director', 'production house', 'gross profit' or 'box office collection')। किसी भी विवरण के लिए कोई शीर्षक या लेबल की आवश्यकता नहीं है, इसे एक प्राकृतिक पाठ में समझाएं।
3.  **कहानी का सारांश**: फिल्म की पूरी कहानी, शुरू से अंत तक, बहुत विस्तार से हिंदी में समझाएं। कहानी में कुछ अवधारणाओं या फिल्म-निर्माण के शब्दों (उदाहरण के लिए, 'plot twist', 'character arc', 'visual effects', 'climax', 'flashback', 'protagonist', 'antagonist', 'sequel') को समझाने के लिए English words का उपयोग करें।
4.  **निष्कर्ष**: "अगर आपको वीडियो पसंद आया, तो कृपया Pujiverse Cinema चैनल को लाइक करें, शेयर करें और सब्सक्राइब करें, और मेरे वीडियो के और नवीनतम अपडेट पाने के लिए बेल आइकन दबाएं।" से समाप्त करें।
`;
      voiceoverLanguageDescription = "Hindi & English Mix";
      languageHashtag = `#HindiMovies`;
      languageTag = `Hindi cinema, Hindi movie analysis`;
      break;

    case 'telugu-mix':
    default:
      systemInstruction = `You are an expert movie commentator for Pujiverse Cinema. Your primary goal is to create an engaging voice-over script. The script should be primarily in Telugu, but seamlessly and *frequently* integrate English words for concepts or terms that are either difficult to translate accurately, commonly used in the film industry (e.g., 'plot twist', 'flashback', 'climax', 'protagonist', 'antagonist', 'sequel', 'visual effects', 'box office collection', 'release date', 'director', 'production house'), or generally better understood in English, to ensure easy understanding of key cinematic concepts and details for a broader audience.`;
      prompt = `
నేను మీకు ఒక సినిమా పేరు ఇస్తాను, దాని కోసం ఒక వివరణాత్మక voice-over script ని తయారు చేయండి. స్క్రిప్ట్ లో ఈ క్రింది వివరాలు ఒక continuous script లా ఉండాలి, ఎటువంటి headings, bolding, italics లేదా markdown formatting లేకుండా.

1.  సినిమా పరిచయం: "Hello everyone! Welcome to Pujiverse Cinema with me, Pujith Sakhamuri. Today in this video we are going to discuss about the movie ${cleanedMovieName} with all the details." అని ప్రారంభించండి.
2.  సినిమా వివరాలు: Movie Title, Cast, Release date, Director, Production company, Gross profit - ఈ వివరాలన్నింటినీ తెలుగులో స్పష్టంగా వివరించండి. ముఖ్యమైన సినిమా వివరాలు మరియు కథాంశంలోని కీలక అంశాలను సులభంగా అర్థం చేసుకోవడానికి, దయచేసి తరచుగా English terms (ఉదాహరణకు, 'movie title', 'cast', 'release date', 'director', 'production house', 'gross profit' or 'box office collection') ను ఉపయోగించండి. ఏ details కు heading లు లేదా label లు అవసరం లేదు, ఒక సహజమైన వచనంలో వివరించండి.
3.  కథాంశం: సినిమా కథ మొత్తాన్ని, ప్రారంభం నుండి ముగింపు వరకు, చాలా వివరంగా తెలుగులో వివరించండి. కథలో కొన్ని concepts లేదా film-making terms (ఉదాహరణకు, 'plot twist', 'character arc', 'visual effects', 'climax', 'flashback', 'protagonist', 'antagonist', 'sequel') ను వివరించడానికి English words ఉపయోగించండి.
4.  ముగింపు: "If you like the video please like, share and subscribe to my channel Pujiverse Cinema and hit bell icon to get more latest updates of my videos." అని ముగించండి.
`;
      voiceoverLanguageDescription = "Telugu & English Mix";
      languageHashtag = `#TeluguMovies`;
      languageTag = `Telugu cinema, Telugu movie analysis`;
      break;
  }

  let extractedMovieDetails: MovieDetails; // Changed to non-nullable, will be initialized with defaults
  let groundingUrls: string[] = [];
  let scriptText: string = '';
  let audioBase64: string | undefined;
  let thumbnailBase64: string | null = null;

  try {
    // --- Step 1: Extract Movie Details for YouTube Description ---
    const movieDetailsPrompt = `Extract the exact Movie Title, Main Cast (comma-separated), Release Date (e.g., "July 10, 2015"), Director (comma-separated), Production Company, and estimated Gross Profit (e.g., "₹650 Crores" or "$100 million") for the movie "${cleanedMovieName}". If a detail is not found or not applicable, use "N/A". Return this information in JSON format.`;

    try {
      const detailsResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash", // Using flash for quick structured extraction
        contents: movieDetailsPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: movieDetailsSchema,
          temperature: 0.2, // Low temperature for factual extraction
          maxOutputTokens: 500,
          thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for quick factual extraction
        },
      });

      const jsonStr = detailsResponse.text.trim();
      const parsedDetails = JSON.parse(jsonStr) as Partial<MovieDetails>; // Parse as Partial

      // Ensure all required fields are present, otherwise default to "N/A"
      extractedMovieDetails = {
        title: parsedDetails.title || cleanedMovieName,
        cast: parsedDetails.cast || "N/A",
        releaseDate: parsedDetails.releaseDate || "N/A",
        director: parsedDetails.director || "N/A",
        production: parsedDetails.production || "N/A",
        grossProfit: parsedDetails.grossProfit || "N/A",
      };

    } catch (parseError) {
      console.error("Failed to parse movie details JSON or get response:", parseError);
      // Fallback if JSON parsing fails or content is not JSON or API call fails
      extractedMovieDetails = {
        title: cleanedMovieName, // Default to cleanedMovieName for title
        cast: "N/A",
        releaseDate: "N/A",
        director: "N/A",
        production: "N/A",
        grossProfit: "N/A",
      };
    }


    // --- Step 2: Generate Voiceover Script ---
    const voiceoverResponse: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }], // Use Google Search for up-to-date movie info
        temperature: 0.7,
        maxOutputTokens: 8192, // Increased token limit for a more detailed story
        thinkingConfig: { thinkingBudget: 24576 }, // Max budget for 2.5-flash to allow detailed reasoning
      },
    });

    scriptText = voiceoverResponse.text.trim();

    // Extract grounding URLs
    if (voiceoverResponse.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      groundingUrls = voiceoverResponse.candidates[0].groundingMetadata.groundingChunks
        .filter((chunk: any) => chunk.web?.uri) // Filter for web grounding chunks
        .map((chunk: any) => chunk.web.uri);
    }

    // --- Step 3: Generate Speech from the Script ---
    const speechResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: scriptText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName }, // Use the selected voiceName
          },
        },
      },
    });

    audioBase64 = speechResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioBase64) {
      throw new Error("Failed to generate audio.");
    }

    // --- Step 4: Generate Thumbnail Image ---
    try {
      // Create a concise, visual prompt from the script for image generation
      // Include the movie title and "Pujiverse Cinema" in the image prompt
      const imagePromptGenResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a very concise, visual prompt (1-2 sentences) for an image generation model that captures the essence and key visual elements of the following movie story for a thumbnail image. Include the movie title "${extractedMovieDetails.title}" and "Pujiverse Cinema" prominently as text in the image. Focus on the main setting, characters, and overall mood. Story excerpt: ${scriptText.substring(0, Math.min(scriptText.length, 1000))}...`,
        config: {
          temperature: 0.7,
          maxOutputTokens: 150, // Slightly increase tokens to allow for title instruction
          thinkingConfig: { thinkingBudget: 0 }, // quick prompt generation
        }
      });
      const imageGenerationPrompt = imagePromptGenResponse.text.trim();
      console.log("Image Generation Prompt for Imagen-4.0:", imageGenerationPrompt); // Added log

      if (imageGenerationPrompt) {
        const imageResponse = await ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
          prompt: imageGenerationPrompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '16:9',
          },
        });
        console.log("Raw Image Generation Response:", imageResponse); // Added log
        thumbnailBase64 = imageResponse.generatedImages[0]?.image?.imageBytes || null;
        if (thumbnailBase64) {
          console.log("Thumbnail Base64 generated successfully (first 50 chars):", thumbnailBase64.substring(0, 50) + "...");
        } else {
          console.warn("Thumbnail Base64 was null or undefined from imageResponse, possibly no image was generated.");
        }
      } else {
        console.warn("Image generation prompt was empty, skipping thumbnail generation.");
      }
    } catch (imageGenError) {
      console.error("Failed to generate thumbnail image:", imageGenError);
      // Continue even if image generation fails, just set thumbnailBase64 to null
      thumbnailBase64 = null;
    }


    // --- Step 5: Assemble YouTube Content Ideas ---
    // Use extracted movie details in the YouTube description template
    // These now safely refer to extractedMovieDetails which has "N/A" fallbacks
    const titleForDescription = extractedMovieDetails.title;
    const castForDescription = extractedMovieDetails.cast;
    const releaseDateForDescription = extractedMovieDetails.releaseDate;
    const directorForDescription = extractedMovieDetails.director;
    const productionForDescription = extractedMovieDetails.production;
    const grossProfitForDescription = extractedMovieDetails.grossProfit;


    const youtubeTitleIdeas = [
      `${titleForDescription} Full Story & Details In ${voiceoverLanguageDescription} - Must Watch Movie Review!`,
      `Pujiverse Exclusive: ${titleForDescription} Voice-Over - ${voiceoverLanguageDescription} Cinema Insight!`,
      `${titleForDescription} Complete Story & Analysis: Box Office, Cast & Director - ${voiceoverLanguageDescription}`,
      `Is ${titleForDescription} a Blockbuster? Full Movie Analysis | ${voiceoverLanguageDescription} Movie Review`,
    ];

    const groundingUrlList = groundingUrls.map((url, index) => `*   **Source ${index + 1}:** ${url}`).join('\n');

    const youtubeDescriptionTemplate = `
Hello everyone! Welcome to Pujiverse Cinema with Pujith Sakhamuri! In this video, we're diving deep into the movie ${titleForDescription}. Discover how this film earned its special place in cinema, its compelling plot, stellar cast, and incredible box office journey.

This voice-over provides a comprehensive analysis in ${voiceoverLanguageDescription}, covering everything from the movie's intricate character arcs and visionary direction to its significant gross profit.

Whether you're a devoted fan or just curious, this video offers a complete overview. We discuss the film's production, release date, and key elements that made it a memorable cinematic experience. From its initial plot twist to the thrilling climax and stunning visual effects, every detail is explored for your full understanding.

Our Pujiverse Cinema channel brings you insightful and engaging content about Indian cinema.

**Movie Details:**
*   **Movie Title:** ${titleForDescription}
*   **Voice-over Language:** ${voiceoverLanguageDescription}
*   **Cast:** ${castForDescription}
*   **Release Date:** ${releaseDateForDescription}
*   **Director:** ${directorForDescription}
*   **Production:** ${productionForDescription}
*   **Gross Profit:** ${grossProfitForDescription}
*   **Story Summary:** Detailed story from beginning to end is explained in the voice-over.

**For more information and sources used in this analysis, check out these links:**
${groundingUrlList}

If you enjoyed this video, please like, share it with your friends, and subscribe to Pujiverse Cinema. Hit the bell icon for more updates!
    `.trim();

    const youtubeHashtags = [
      `#PujiverseCinema`,
      `#${titleForDescription.replace(/\s+/g, '')}`,
      languageHashtag, // e.g., #TeluguMovies, #HindiMovies, #EnglishMovies
      `#IndianCinema`,
      `#MovieReview`,
      `#FilmAnalysis`,
      `#MovieExplanation`,
      `#VoiceOver`,
      `#CinemaTalk`,
      `#Tollywood`, // Add Bollywood/Kollywood/etc. if applicable
      `#Blockbuster`,
      `#FilmFacts`,
      `#NewMovie`,
      `#FullStory`,
      `#DetailedReview`,
      `#SouthIndianCinema`,
      `#Entertainment`,
      `#PujithSakhamuri`
    ];
    if (contentLanguage === 'telugu-mix') youtubeHashtags.push('#TeluguEnglishMix');
    if (contentLanguage === 'hindi-mix') youtubeHashtags.push('#HindiEnglishMix');


    const youtubeTags = [
      `${titleForDescription}`,
      `${titleForDescription} full story`,
      `${titleForDescription} review`,
      `${titleForDescription} analysis`,
      languageTag, // e.g., Telugu cinema, Hindi cinema, English cinema
      `Indian cinema`,
      `Pujiverse Cinema`,
      `Pujith Sakhamuri`,
      `movie voice over`,
      `film industry news`,
      `movie details`,
      `plot twist`,
      `climax`,
      `visual effects`,
      `release date`,
      `production house`,
      `box office collection ${titleForDescription}`,
    ];
    if (contentLanguage === 'telugu-mix') youtubeTags.push('Telugu English mix', 'Telugu film review');
    if (contentLanguage === 'hindi-mix') youtubeTags.push('Hindi English mix', 'Hindi film review');


    return {
      script: scriptText,
      audioBase64: audioBase64,
      thumbnailBase64: thumbnailBase64,
      groundingUrls: groundingUrls,
      youtubeTitleIdeas: youtubeTitleIdeas,
      youtubeDescriptionTemplate: youtubeDescriptionTemplate,
      youtubeHashtags: youtubeHashtags,
      youtubeTags: youtubeTags,
      extractedMovieDetails: extractedMovieDetails, // Include for potential future UI display
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Specific error handling for API key issues
    if (error.message && (error.message.includes("Authentication failed") || error.message.includes("Requested entity was not found."))) {
      console.warn("API key might be invalid or not selected. Prompting user to select a key.");
      throw new Error("Authentication failed. Please ensure a valid API key is selected.");
    }
    // For generic 500 errors or other unknown errors
    throw new Error(`Failed to generate movie voice-over: ${error.message || 'Unknown error'}. Please try again, check your network, or re-select your API key.`);
  }
};