"use client";

import { useState } from "react";
import axios from "axios";
import DownloadButton from "../components/DownloadButton";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: number;
  author: string;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [downloadType, setDownloadType] = useState<"video" | "audio" | null>(
    null,
  );

  const handleFetchInfo = async () => {
    if (!url) {
      setError("Please enter a YouTube URL");
      return;
    }

    setLoading(true);
    setError("");
    setVideoInfo(null);

    try {
      // Try ytdl-core first
      const response = await axios.post(`${API_BASE_URL}/api/info`, {
        url,
      });
      setVideoInfo(response.data);
    } catch (err: any) {
      console.log("ytdl-core failed, trying play-dl...");

      // Fallback to play-dl
      try {
        const playDlResponse = await axios.post(
          `${API_BASE_URL}/api/info-playdl`,
          {
            url,
          },
        );
        setVideoInfo(playDlResponse.data);
      } catch (playDlErr: any) {
        console.log("play-dl failed, trying simple method...");

        // Final fallback to simple method
        try {
          const simpleResponse = await axios.post(
            `${API_BASE_URL}/api/info-simple`,
            {
              url,
            },
          );
          setVideoInfo(simpleResponse.data);
        } catch (simpleErr: any) {
          console.log("simple method failed, trying noembed fallback...");

          // Final fallback to noembed method
          try {
            const fallbackResponse = await axios.post(
              `${API_BASE_URL}/api/info-fallback`,
              {
                url,
              },
            );
            setVideoInfo(fallbackResponse.data);
          } catch (fallbackErr: any) {
            setError(
              "All methods failed. Please try a different video or try again later.",
            );
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (type: "video" | "audio") => {
    if (!url) {
      setError("Please enter a YouTube URL");
      return;
    }

    setDownloadType(type);
    setError("");

    try {
      // Try ytdl-core first
      const endpoint =
        type === "video" ? "/api/download/video" : "/api/download/audio";

      const response = await axios.post(
        `${API_BASE_URL}${endpoint}`,
        { url },
        {
          responseType: "blob",
        },
      );

      // Create download link
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = downloadUrl;

      const extension = type === "video" ? "mp4" : "mp3";
      const filename = videoInfo?.title
        ? `${videoInfo.title.replace(/[^\w\s]/gi, "")}.${extension}`
        : `download.${extension}`;

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.log("ytdl-core download failed, trying play-dl...");

      // Fallback to play-dl
      try {
        const playDlEndpoint =
          type === "video"
            ? "/api/download/video-playdl"
            : "/api/download/audio-playdl";

        const playDlResponse = await axios.post(
          `${API_BASE_URL}${playDlEndpoint}`,
          { url },
          {
            responseType: "blob",
          },
        );

        // Create download link
        const downloadUrl = window.URL.createObjectURL(
          new Blob([playDlResponse.data]),
        );
        const link = document.createElement("a");
        link.href = downloadUrl;

        const extension = type === "video" ? "mp4" : "mp3";
        const filename = videoInfo?.title
          ? `${videoInfo.title.replace(/[^\w\s]/gi, "")}.${extension}`
          : `download.${extension}`;

        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(downloadUrl);
      } catch (playDlErr: any) {
        console.log("play-dl failed, trying simple method...");

        // Final fallback to simple method
        try {
          const simpleEndpoint =
            type === "video"
              ? "/api/download/video-simple"
              : "/api/download/audio-simple";

          const simpleResponse = await axios.post(
            `${API_BASE_URL}${simpleEndpoint}`,
            { url },
          );

          // For simple method, show download link instead of blob
          if (simpleResponse.data.downloadUrl) {
            window.open(simpleResponse.data.downloadUrl, "_blank");
            setError(
              `Download link opened in new tab: ${simpleResponse.data.note}`,
            );
          }
        } catch (simpleErr: any) {
          setError(
            "All download methods failed. Please try a different video.",
          );
        }
      }
    } finally {
      setDownloadType(null);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            YouTube Downloader
          </h1>
          <p className="text-xl text-white/90">
            Download videos and audio from YouTube easily
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12">
          {/* Input Section */}
          <div className="mb-8">
            <label
              htmlFor="url"
              className="block text-gray-700 font-semibold mb-3 text-lg"
            >
              Enter YouTube URL
            </label>
            <div className="flex gap-3">
              <input
                id="url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFetchInfo()}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 transition-all text-gray-800 text-lg"
              />
              <button
                onClick={handleFetchInfo}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? "Loading..." : "Get Info"}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg">
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Video Info */}
          {videoInfo && (
            <>
              <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
                <div className="flex items-start gap-6">
                  {videoInfo.thumbnail && (
                    <img
                      src={videoInfo.thumbnail}
                      alt={videoInfo.title}
                      className="w-32 h-32 object-cover rounded-xl shadow-md"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {videoInfo.title}
                    </h3>
                    <p className="text-gray-600 mb-1">
                      <span className="font-semibold">Channel:</span>{" "}
                      {videoInfo.author}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-semibold">Duration:</span>{" "}
                      {Math.floor(videoInfo.duration / 60)}:
                      {(videoInfo.duration % 60).toString().padStart(2, "0")}
                    </p>
                  </div>
                </div>
              </div>
              {/* Download Buttons */}
              <div className="grid md:grid-cols-2 gap-6">
                <DownloadButton
                  url={url}
                  videoInfo={videoInfo}
                  type="video"
                  onDownloadComplete={() =>
                    console.log("Video download completed")
                  }
                  onError={(error) => setError(error)}
                />

                <DownloadButton
                  url={url}
                  videoInfo={videoInfo}
                  type="audio"
                  onDownloadComplete={() =>
                    console.log("Audio download completed")
                  }
                  onError={(error) => setError(error)}
                />
              </div>
            </>
          )}

          {/* Info Text */}
          <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
            <p className="text-blue-800 text-sm">
              <span className="font-semibold">💡 Tip:</span> Paste a YouTube URL
              above, click &quot;Get Info&quot; to preview, then choose whether to
              download the video or audio only.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white/80">
          <p className="text-sm">
            Download videos and audio for personal use only. Respect copyright
            laws.
          </p>
        </div>
      </div>
    </main>
  );
}
