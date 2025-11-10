
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import { GeneratedVoiceover, MovieDetails } from "../types";

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
  apiKey: string,
  movieName: string,
  voiceName: string = 'Zephyr',
  contentLanguage: 'english' | 'telugu-mix' | 'hindi-mix' = 'telugu-mix'
): Promise<GeneratedVoiceover> => {

  if (!apiKey) {
    throw new Error("Authentication failed. API Key is missing.");
  }
  
  const ai = new GoogleGenAI({ apiKey });

  let systemInstruction: string;
  let prompt: string;
  let voiceoverLanguageDescription: string;
  let languageHashtag: string;
  let languageTag: string;

  const cleanedMovieName = movieName.replace(/\s+/g, ' ');

  // FIX: Use `contentLanguage` parameter instead of undefined `selectedContentLanguage`.
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
मैं आपको एक फिल्म का नाम दूंगा, उसके लिए एक विस्तृत voice-over script तैयार करें। स्क्रिप्ट एक निरंतर स्क्रिप्ट होनी चाहिए, जिसमें कोई शीर्षक, बोल्डिंग, इटलिक्स या मार्कडाउन फ़ॉर्मेटिंग न हो।

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
2.  సినిమా వివరాలు: Movie Title, Cast, Release date, Director, Production company, Gross profit - ఈ వివరాలన్నింటినీ తెలుగులో స్పష్టంగా వివరించండి. ముఖ్యమైన సినిమా వివరాలు మరియు కథాంశంలోని కీలక అంశాలను సులభంగా అర్థం చేసుకోవడానికి, దయచేసి తరచుగా English terms (ఉదాహరణకు, 'movie title', 'cast', 'release date', 'director', 'production house', 'gross profit' or 'box office collection') ను ఉపయోగించండి. ఏ details కు heading లు లేదా label లు అవసరం లేదు, ఒక సహజమైన వచనంలో వివరించండి।
3.  కథాంశం: సినిమా కథ మొత్తాన్ని, ప్రారంభం నుండి ముగింపు వరకు, చాలా వివరంగా తెలుగులో వివరించండి. కథలో కొన్ని concepts లేదా film-making terms (ఉదాహరణకు, 'plot twist', 'character arc', 'visual effects', 'climax', 'flashback', 'protagonist', 'antagonist', 'sequel') ను వివరించడానికి English words ఉపయోగించండి.
4.  ముగింపు: "If you like the video please like, share and subscribe to my channel Pujiverse Cinema and hit bell icon to get more latest updates of my videos." అని ముగించండి.
`;
      voiceoverLanguageDescription = "Telugu & English Mix";
      languageHashtag = `#TeluguMovies`;
      languageTag = `Telugu cinema, Telugu movie analysis`;
      break;
  }

  let extractedMovieDetails: MovieDetails;
  let groundingUrls: string[] = [];
  let scriptText: string = '';
  let audioBase64: string | undefined;
  let thumbnailBase64: string | null = null;

  try {
    // Step 1: Extract Movie Details
    const movieDetailsPrompt = `Extract the exact Movie Title, Main Cast (comma-separated), Release Date (e.g., "July 10, 2015"), Director (comma-separated), Production Company, and estimated Gross Profit (e.g., "₹650 Crores" or "$100 million") for the movie "${cleanedMovieName}". If a detail is not found or not applicable, use "N/A". Return this information in JSON format.`;

    try {
      const detailsResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: movieDetailsPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: movieDetailsSchema,
          temperature: 0.2,
          maxOutputTokens: 500,
          thinkingConfig: { thinkingBudget: 0 },
        },
      });

      const jsonStr = detailsResponse.text.trim();
      const parsedDetails = JSON.parse(jsonStr) as Partial<MovieDetails>;

      extractedMovieDetails = {
        title: parsedDetails.title || cleanedMovieName,
        cast: parsedDetails.cast || "N/A",
        releaseDate: parsedDetails.releaseDate || "N/A",
        director: parsedDetails.director || "N/A",
        production: parsedDetails.production || "N/A",
        grossProfit: parsedDetails.grossProfit || "N/A",
      };

    } catch (parseError) {
      console.error("Failed to parse movie details JSON:", parseError);
      extractedMovieDetails = {
        title: cleanedMovieName,
        cast: "N/A",
        releaseDate: "N/A",
        director: "N/A",
        production: "N/A",
        grossProfit: "N/A",
      };
    }

    // Step 2: Generate Voiceover Script
    const voiceoverResponse: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
        maxOutputTokens: 8192,
        thinkingConfig: { thinkingBudget: 24576 },
      },
    });

    scriptText = voiceoverResponse.text.trim();

    if (voiceoverResponse.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      groundingUrls = voiceoverResponse.candidates[0].groundingMetadata.groundingChunks
        .filter((chunk: any) => chunk.web?.uri)
        .map((chunk: any) => chunk.web.uri);
    }
    
    // Step 3: Generate Speech
    const speechResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: scriptText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            // FIX: Use `voiceName` parameter instead of undefined `selectedVoice`.
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    audioBase64 = speechResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioBase64) {
      throw new Error("Failed to generate audio.");
    }

    // Step 4: Generate Thumbnail
    try {
      const imagePromptGenResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a very concise, visual prompt (1-2 sentences) for an image generation model that captures the essence and key visual elements of the following movie story for a thumbnail image. Include the movie title "${extractedMovieDetails.title}" and "Pujiverse Cinema" prominently as text in the image. Focus on the main setting, characters, and overall mood. Story excerpt: ${scriptText.substring(0, Math.min(scriptText.length, 1000))}...`,
        config: {
          temperature: 0.7,
          maxOutputTokens: 150,
          thinkingConfig: { thinkingBudget: 0 },
        }
      });
      const imageGenerationPrompt = imagePromptGenResponse.text.trim();
      
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
        thumbnailBase64 = imageResponse.generatedImages[0]?.image?.imageBytes || null;
      }
    } catch (imageGenError) {
      console.error("Failed to generate thumbnail image:", imageGenError);
      thumbnailBase64 = null;
    }

    // Step 5: Assemble YouTube Content
    const { title, cast, releaseDate, director, production, grossProfit } = extractedMovieDetails;

    const youtubeTitleIdeas = [
      `${title} Full Story & Details In ${voiceoverLanguageDescription} - Must Watch Movie Review!`,
      `Pujiverse Exclusive: ${title} Voice-Over - ${voiceoverLanguageDescription} Cinema Insight!`,
      `${title} Complete Story & Analysis: Box Office, Cast & Director - ${voiceoverLanguageDescription}`,
      `Is ${title} a Blockbuster? Full Movie Analysis | ${voiceoverLanguageDescription} Movie Review`,
    ];

    const groundingUrlList = groundingUrls.map((url, index) => `*   **Source ${index + 1}:** ${url}`).join('\n');

    const youtubeDescriptionTemplate = `
Hello everyone! Welcome to Pujiverse Cinema with Pujith Sakhamuri! In this video, we're diving deep into the movie ${title}. Discover how this film earned its special place in cinema, its compelling plot, stellar cast, and incredible box office journey.

This voice-over provides a comprehensive analysis in ${voiceoverLanguageDescription}, covering everything from the movie's intricate character arcs and visionary direction to its significant gross profit.

Whether you're a devoted fan or just curious, this video offers a complete overview. We discuss the film's production, release date, and key elements that made it a memorable cinematic experience. From its initial plot twist to the thrilling climax and stunning visual effects, every detail is explored for your full understanding.

Our Pujiverse Cinema channel brings you insightful and engaging content about Indian cinema.

**Movie Details:**
*   **Movie Title:** ${title}
*   **Voice-over Language:** ${voiceoverLanguageDescription}
*   **Cast:** ${cast}
*   **Release Date:** ${releaseDate}
*   **Director:** ${director}
*   **Production:** ${production}
*   **Gross Profit:** ${grossProfit}
*   **Story Summary:** Detailed story from beginning to end is explained in the voice-over.

**For more information and sources used in this analysis, check out these links:**
${groundingUrlList}

If you enjoyed this video, please like, share it with your friends, and subscribe to Pujiverse Cinema. Hit the bell icon for more updates!
    `.trim();

    const youtubeHashtags = [
      `#PujiverseCinema`,
      `#${title.replace(/\s+/g, '')}`,
      languageHashtag,
      `#IndianCinema`,
      `#MovieReview`,
      `#FilmAnalysis`,
      `#MovieExplanation`,
      `#VoiceOver`,
      `#CinemaTalk`,
      `#Tollywood`,
      `#Blockbuster`,
      `#FilmFacts`,
      `#NewMovie`,
      `#FullStory`,
      `#DetailedReview`,
      `#SouthIndianCinema`,
      `#Entertainment`,
      `#PujithSakhamuri`
    ];
    // FIX: Use `contentLanguage` parameter instead of undefined `selectedContentLanguage`.
    if (contentLanguage === 'telugu-mix') youtubeHashtags.push('#TeluguEnglishMix');
    // FIX: Use `contentLanguage` parameter instead of undefined `selectedContentLanguage`.
    if (contentLanguage === 'hindi-mix') youtubeHashtags.push('#HindiEnglishMix');


    const youtubeTags = [
      `${title}`,
      `${title} full story`,
      `${title} review`,
      `${title} analysis`,
      languageTag,
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
      `box office collection ${title}`,
    ];
    // FIX: Use `contentLanguage` parameter instead of undefined `selectedContentLanguage`.
    if (contentLanguage === 'telugu-mix') youtubeTags.push('Telugu English mix', 'Telugu film review');
    // FIX: Use `contentLanguage` parameter instead of undefined `selectedContentLanguage`.
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
      extractedMovieDetails: extractedMovieDetails,
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.toString().includes("API key not valid")) {
       throw new Error("Authentication failed. The provided API key is not valid. Please check the key and try again.");
    }
    throw new Error(`Failed to generate movie voice-over: ${error.message || 'Unknown error'}.`);
  }
};
