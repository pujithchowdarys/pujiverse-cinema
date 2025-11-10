
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { generateMovieVoiceover } from './services/geminiService';
import { decode, decodeAudioData, encodeWAV } from './utils/audio';
import Spinner from './components/Spinner';
import { GeneratedVoiceover } from './types';

function App() {
  const [movieName, setMovieName] = useState<string>('');
  const [generatedContent, setGeneratedContent] = useState<GeneratedVoiceover | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [tempApiKey, setTempApiKey] = useState<string>('');
  const [isKeySaved, setIsKeySaved] = useState<boolean>(false);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [thumbnailBlobUrl, setThumbnailBlobUrl] = useState<string | null>(null);

  const voiceOptions = ['Zephyr', 'Kore', 'Puck', 'Charon', 'Fenrir'];
  const [selectedVoice, setSelectedVoice] = useState<string>(voiceOptions[0]);

  type ContentLanguage = 'english' | 'telugu-mix' | 'hindi-mix';
  const contentLanguageOptions: { label: string; value: ContentLanguage }[] = [
    { label: 'English', value: 'english' },
    { label: 'Telugu + English Mix', value: 'telugu-mix' },
    { label: 'Hindi + English Mix', value: 'hindi-mix' },
  ];
  const [selectedContentLanguage, setSelectedContentLanguage] = useState<ContentLanguage>('telugu-mix');

  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini-api-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setIsKeySaved(true);
    }
    
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    }

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (audioBlobUrl) {
        URL.revokeObjectURL(audioBlobUrl);
      }
      if (thumbnailBlobUrl) {
        URL.revokeObjectURL(thumbnailBlobUrl);
      }
    };
  }, [audioBlobUrl, thumbnailBlobUrl]);

  const handleSaveKey = () => {
    if (tempApiKey.trim()) {
      localStorage.setItem('gemini-api-key', tempApiKey.trim());
      setApiKey(tempApiKey.trim());
      setIsKeySaved(true);
      setError(null);
    } else {
      setError("Please enter a valid API key.");
    }
  };
  
  const handleForgetApiKey = () => {
    localStorage.removeItem('gemini-api-key');
    setApiKey('');
    setTempApiKey('');
    setIsKeySaved(false);
  };

  const copyToClipboard = useCallback((text: string, fieldName: string) => {
    navigator.clipboard.writeText(text).then(() => {
        alert(`${fieldName} copied to clipboard!`);
    }).catch(err => {
        console.error(`Failed to copy ${fieldName} to clipboard: `, err);
        alert(`Failed to copy ${fieldName}. Please try again.`);
    });
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!isKeySaved) {
      setError("Please save your Gemini API key first.");
      return;
    }
    if (!movieName.trim()) {
      setError("Please enter a movie name.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);

    if (audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
      setAudioBlobUrl(null);
    }
    if (thumbnailBlobUrl) {
      URL.revokeObjectURL(thumbnailBlobUrl);
      setThumbnailBlobUrl(null);
    }

    try {
      const result = await generateMovieVoiceover(apiKey, movieName, selectedVoice, selectedContentLanguage);
      setGeneratedContent(result);

      if (result.audioBase64 && audioContextRef.current) {
        const audioBytes = decode(result.audioBase64);
        const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
        const wavBlob = encodeWAV(audioBuffer);
        const url = URL.createObjectURL(wavBlob);
        setAudioBlobUrl(url);
      }

      if (result.thumbnailBase64) {
        const imageUrl = `data:image/jpeg;base64,${result.thumbnailBase64}`;
        setThumbnailBlobUrl(imageUrl);
      }

    } catch (e: any) {
      console.error("Generation failed:", e);
      let errorMessage = e.message || "Failed to generate voice-over. Please try again.";
      if (errorMessage.includes("Authentication failed")) {
        errorMessage = `${errorMessage}. You can enter a new key.`;
        handleForgetApiKey();
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, movieName, isKeySaved, audioBlobUrl, thumbnailBlobUrl, selectedVoice, selectedContentLanguage]);

  const handleDownloadScript = useCallback(() => {
    if (generatedContent?.script) {
      const blob = new Blob([generatedContent.script], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${movieName.replace(/\s+/g, '_')}_script.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [generatedContent, movieName]);

  const handleDownloadAudio = useCallback(async () => {
    if (audioBlobUrl) {
      const a = document.createElement('a');
      a.href = audioBlobUrl;
      a.download = `${movieName.replace(/\s+/g, '_')}_voiceover.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      setError("No audio available to download. Please generate voice-over first.");
    }
  }, [audioBlobUrl, movieName]);

  const handleDownloadThumbnail = useCallback(() => {
    if (thumbnailBlobUrl) {
      const a = document.createElement('a');
      a.href = thumbnailBlobUrl;
      a.download = `${movieName.replace(/\s+/g, '_')}_thumbnail.jpeg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      setError("No thumbnail available to download. Please generate voice-over first.");
    }
  }, [thumbnailBlobUrl, movieName]);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 bg-gray-50 text-gray-900">
      <header className="w-full max-w-4xl text-center py-8">
        <h1 className="text-5xl font-extrabold text-indigo-700 leading-tight tracking-tight">
          Pujiverse Cinema Storyteller
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          Your personalized movie voice-over generator (Telugu & English mix)
        </p>
      </header>
      
      {!isKeySaved ? (
        <main className="w-full max-w-xl bg-white shadow-lg rounded-xl p-8 space-y-6 md:p-10">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">Enter Your Google Gemini API Key</h2>
            <p className="mt-2 text-gray-600">
              To use this application, please provide your Google Gemini API key. This helps you manage your own usage and associated billing.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Don't have an API key? You can create one for free at{' '}
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-indigo-600 hover:underline"
              >
                Google AI Studio
              </a>. Just click "Create API key in new project" to get started.
            </p>
          </div>
          <div className="flex flex-col space-y-4">
            <label htmlFor="apiKeyInput" className="sr-only">API Key</label>
            <input
              id="apiKeyInput"
              type="password"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder="Paste your API key here (e.g., AIzaSy...)"
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-base"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSaveKey();
                }
              }}
            />
            <button
              onClick={handleSaveKey}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
            >
              Save Key and Start Creating
            </button>
            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}
          </div>
        </main>
      ) : (
        <main className="w-full max-w-3xl bg-white shadow-lg rounded-xl p-8 space-y-8 md:p-10">
          <div className="flex justify-between items-center">
             <p className="text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full">API Key Saved</p>
             <button
               onClick={handleForgetApiKey}
               className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
             >
               Change API Key
             </button>
           </div>
           
          <div className="flex flex-col space-y-4">
            <label htmlFor="movieNameInput" className="text-lg font-semibold text-gray-800">
              Enter Movie Name:
            </label>
            <input
              id="movieNameInput"
              type="text"
              value={movieName}
              onChange={(e) => setMovieName(e.target.value)}
              placeholder="e.g., Baahubali: The Beginning"
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-base"
              disabled={isLoading}
              onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                      handleGenerate();
                  }
              }}
            />

            <label htmlFor="contentLanguageSelect" className="text-lg font-semibold text-gray-800">
              Select Content Language:
            </label>
            <select
              id="contentLanguageSelect"
              value={selectedContentLanguage}
              onChange={(e) => setSelectedContentLanguage(e.target.value as ContentLanguage)}
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-base bg-white"
              disabled={isLoading}
            >
              {contentLanguageOptions.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>

            <label htmlFor="voiceSelect" className="text-lg font-semibold text-gray-800">
              Select Voice for Voice-over:
            </label>
            <select
              id="voiceSelect"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-base bg-white"
              disabled={isLoading}
            >
              {voiceOptions.map((voice) => (
                <option key={voice} value={voice}>
                  {voice}
                </option>
              ))}
            </select>

            <button
              onClick={handleGenerate}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Generating...' : 'Generate Voice-over'}
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative text-center">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline ml-2">{error}</span>
            </div>
          )}

          {isLoading && <Spinner />}

          {generatedContent && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-indigo-700 text-center">Generated Content</h2>

              {/* Script Display */}
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Script:</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 leading-relaxed text-gray-800 whitespace-pre-wrap shadow-inner text-lg">
                  {generatedContent.script}
                </div>
                <button
                  onClick={handleDownloadScript}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  Download Script (TXT)
                </button>
              </div>

              {/* Audio Player */}
              {audioBlobUrl && (
                <div className="flex flex-col items-center gap-4">
                  <p className="text-lg font-medium text-gray-700">Listen to the voice-over:</p>
                  <audio controls src={audioBlobUrl} className="w-full max-w-md bg-gray-100 rounded-lg shadow-md p-2">
                    Your browser does not support the audio element.
                  </audio>
                  <button
                    onClick={handleDownloadAudio}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-5 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                  >
                    Download Voice-over (WAV)
                  </button>
                </div>
              )}

              {/* Generated Thumbnail */}
              {thumbnailBlobUrl && (
                <div className="flex flex-col items-center gap-4">
                  <h3 className="text-2xl font-bold text-gray-800 mt-6 mb-3">Generated Thumbnail:</h3>
                  <img
                    src={thumbnailBlobUrl}
                    alt={`${movieName} thumbnail`}
                    className="w-full max-w-lg rounded-lg shadow-md border border-gray-200"
                    style={{ aspectRatio: '16 / 9', objectFit: 'cover' }}
                  />
                  <button
                    onClick={handleDownloadThumbnail}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-5 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                  >
                    Download Thumbnail (JPEG)
                  </button>
                </div>
              )}

              {/* Grounding URLs */}
              {generatedContent.groundingUrls.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mt-6 mb-3">Sources:</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 text-lg">
                    {generatedContent.groundingUrls.map((url, index) => (
                      <li key={index}>
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-indigo-600 hover:text-indigo-800 hover:underline transition duration-200 ease-in-out"
                        >
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* YouTube Content Ideas */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-800 mt-6 mb-3">YouTube Content Ideas:</h3>

                {/* Title Ideas */}
                <div>
                  <h4 className="text-xl font-bold text-gray-700 mb-2">Title Options (Catchy & SEO-Friendly):</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-800 text-lg">
                    {generatedContent.youtubeTitleIdeas.map((title, index) => (
                      <li key={index} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <span className="flex-1 mr-4">{title}</span>
                        <button
                          onClick={() => copyToClipboard(title, `YouTube Title ${index + 1}`)}
                          className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-1 px-3 rounded-md text-sm transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                          title="Copy to clipboard"
                        >
                          Copy
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Description Template */}
                <div>
                  <h4 className="text-xl font-bold text-gray-700 mb-2">Description Template (Optimized for 1000+ characters):</h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 shadow-inner">
                    <textarea
                      readOnly
                      value={generatedContent.youtubeDescriptionTemplate}
                      className="w-full bg-gray-50 text-gray-800 font-mono text-sm p-2 rounded-md outline-none resize-y min-h-[200px]"
                      aria-label="YouTube Description Template"
                    />
                    <button
                      onClick={() => copyToClipboard(generatedContent.youtubeDescriptionTemplate, 'YouTube Description')}
                      className="mt-3 w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                    >
                      Copy Description
                    </button>
                  </div>
                </div>

                {/* Hashtags */}
                <div>
                  <h4 className="text-xl font-bold text-gray-700 mb-2">Hashtags:</h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 shadow-inner">
                    <textarea
                      readOnly
                      value={generatedContent.youtubeHashtags.join(' ')}
                      className="w-full bg-gray-50 text-gray-800 font-mono text-sm p-2 rounded-md outline-none resize-y min-h-[80px]"
                      aria-label="YouTube Hashtags"
                    />
                    <button
                      onClick={() => copyToClipboard(generatedContent.youtubeHashtags.join(' '), 'YouTube Hashtags')}
                      className="mt-3 w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                    >
                      Copy Hashtags
                    </button>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <h4 className="text-xl font-bold text-gray-700 mb-2">Tags:</h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 shadow-inner">
                    <textarea
                      readOnly
                      value={generatedContent.youtubeTags.join(', ')}
                      className="w-full bg-gray-50 text-gray-800 font-mono text-sm p-2 rounded-md outline-none resize-y min-h-[80px]"
                      aria-label="YouTube Tags"
                    />
                    <button
                      onClick={() => copyToClipboard(generatedContent.youtubeTags.join(', '), 'YouTube Tags')}
                      className="mt-3 w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                    >
                      Copy Tags
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}
        </main>
      )}

      <footer className="w-full max-w-4xl text-center py-8 mt-12 text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Pujiverse Cinema. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;