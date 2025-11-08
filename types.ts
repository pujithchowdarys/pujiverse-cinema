export interface MovieDetails {
  title: string;
  cast: string;
  releaseDate: string;
  director: string;
  production: string;
  grossProfit: string;
  story?: string; // Made optional as it's not always directly extracted in structured way
}

export interface GeneratedVoiceover {
  script: string;
  audioBase64: string;
  thumbnailBase64: string | null; // New field for the generated thumbnail
  groundingUrls: string[];
  youtubeTitleIdeas: string[];
  youtubeDescriptionTemplate: string;
  youtubeHashtags: string[];
  youtubeTags: string[];
  extractedMovieDetails: MovieDetails | null; // To pass extracted details for display if needed
}