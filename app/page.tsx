"use client";

import { useState } from "react";
import axios from "axios";
import Image from "next/image";
import DownloadButton from "../components/DownloadButton";
import { FaYoutube } from "react-icons/fa";
import { FaDownload } from "react-icons/fa";
import { FaMusic } from "react-icons/fa";
import { FaCheckCircle } from "react-icons/fa";
import { FaRocket } from "react-icons/fa";
import { FaShieldAlt } from "react-icons/fa";

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
      setError("Please enter a YouTube video URL.");
      return;
    }

    setLoading(true);
    setError("");
    setVideoInfo(null);

    try {
      // 1. Try Universal first (works for all users)
      const response = await axios.post(`${API_BASE_URL}/api/info-universal`, {
        url,
      });
      setVideoInfo(response.data);
    } catch (err: any) {
      console.log("Universal fetch failed, trying primary...");
      try {
        // 2. Fallback to ytdl-core (Primary)
        const response = await axios.post(`${API_BASE_URL}/api/info`, { url });
        setVideoInfo(response.data);
      } catch (err: any) {
        console.log("Primary fetch failed, trying fallback 1...");
        try {
          // 3. Fallback to play-dl
          const playDlResponse = await axios.post(
            `${API_BASE_URL}/api/info-playdl`,
            { url },
          );
          setVideoInfo(playDlResponse.data);
        } catch (playDlErr: any) {
          console.log("Fallback 1 failed, trying fallback 2...");
          try {
            // 4. Fallback to simple method
            const simpleResponse = await axios.post(
              `${API_BASE_URL}/api/info-simple`,
              { url },
            );
            setVideoInfo(simpleResponse.data);
          } catch (simpleErr: any) {
            console.log("Fallback 2 failed, trying fallback 3...");
            try {
              // 5. Final Fallback (noembed)
              const fallbackResponse = await axios.post(
                `${API_BASE_URL}/api/info-fallback`,
                { url },
              );
              setVideoInfo(fallbackResponse.data);
            } catch (finalErr) {
              setError(
                "Unable to process this video. Please ensure link is correct and accessible.",
              );
            }
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (type: "video" | "audio") => {
    // (This function remains mostly same, just updating UI feedback calls if needed)
    // For brevity in this overhaul, I am keeping logic similar but wrapping in better UI
    // Logic for downloading...
    if (!url) return;
    setDownloadType(type);
    setError("");

    const downloadWithEndpoint = async (endpoint: string) => {
      const response = await axios.post(
        `${API_BASE_URL}${endpoint}`,
        { url },
        {
          responseType: "blob",
          // Increase timeout for downloads
          timeout: 300000,
        },
      );

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
      return true;
    };

    try {
      // 1. Try primary method (yt-dlp)
      const primaryEndpoint =
        type === "video" ? "/api/download/video" : "/api/download/audio";
      console.log(`Attempting primary download: ${primaryEndpoint}`);
      await downloadWithEndpoint(primaryEndpoint);
    } catch (err: any) {
      console.log("Primary download failed, trying play-dl fallback...");
      try {
        // 2. Try play-dl fallback
        const fallbackEndpoint =
          type === "video"
            ? "/api/download/video-playdl"
            : "/api/download/audio-playdl";
        await downloadWithEndpoint(fallbackEndpoint);
      } catch (fallbackErr: any) {
        console.error("All download methods failed", fallbackErr);

        // Try to extract a helpful error message from the blob response
        if (fallbackErr.response?.data instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorData = JSON.parse(reader.result as string);
              setError(
                errorData.error ||
                  "Download failed. This usually happens when YouTube blocks the server IP.",
              );
            } catch (e) {
              setError(
                "Download failed. The server might be blocked by YouTube.",
              );
            }
          };
          reader.readAsText(fallbackErr.response.data);
        } else {
          setError(
            "Download failed. Please try again or use a different video.",
          );
        }
      }
    } finally {
      setDownloadType(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-purple-500 selection:text-white">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "VidFlow",
            applicationCategory: "MultimediaApplication",
            operatingSystem: "Web",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            description:
              "Download YouTube videos and audio for free in high quality.",
          }),
        }}
      />

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/30 rounded-full blur-[120px]" />

        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-gray-300">
              Fast & Free Video Downloader
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-blue-200 tracking-tight">
            VidFlow
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Download{" "}
            <span className="text-white font-semibold">YouTube videos</span> and{" "}
            <span className="text-white font-semibold">MP3 audio</span>{" "}
            instantly. No ads, no limits, just flow.
          </p>

          {/* Input Card */}
          <div className="max-w-3xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2 md:p-3 shadow-2xl shadow-purple-900/20 transform transition-all hover:scale-[1.01]">
            <div className="flex flex-col md:flex-row gap-3">
              <input
                id="youtube-url-input"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFetchInfo()}
                placeholder="Paste YouTube link here..."
                aria-label="YouTube Video URL"
                className="flex-1 bg-transparent px-6 py-4 text-lg text-white placeholder-gray-500 focus:outline-none w-full"
              />
              <button
                onClick={handleFetchInfo}
                disabled={loading}
                aria-label={
                  loading ? "Processing video" : "Start video download process"
                }
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? "Processing..." : "Start Download"}
              </button>
            </div>
          </div>
          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-lg max-w-lg mx-auto backdrop-blur-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Result Section */}
      {videoInfo && (
        <div className="max-w-4xl mx-auto px-6 mb-20 animate-fade-in-up">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
              <div className="relative group w-full md:w-80 flex-shrink-0">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative aspect-video rounded-xl overflow-hidden shadow-lg">
                  <Image
                    src={videoInfo.thumbnail}
                    alt={videoInfo.title || "img"}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="flex-1 w-full text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">
                  {videoInfo.title}
                </h2>
                <div className="flex items-center justify-center md:justify-start gap-4 text-gray-400 mb-8">
                  <div className="flex items-center gap-2">
                    <FaYoutube className="text-red-500" />
                    <span>{videoInfo.author}</span>
                  </div>
                  <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                  <span>
                    {Math.floor(videoInfo.duration / 60)}:
                    {(videoInfo.duration % 60).toString().padStart(2, "0")}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <DownloadButton
                    url={url}
                    videoInfo={videoInfo}
                    type="video"
                    onDownloadComplete={() => setDownloadType(null)}
                    onError={(error) => setError(error)}
                  />
                  <DownloadButton
                    url={url}
                    videoInfo={videoInfo}
                    type="audio"
                    onDownloadComplete={() => setDownloadType(null)}
                    onError={(error) => setError(error)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features Grid */}
      <section className="bg-white/5 py-20 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Why Choose VidFlow?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: FaRocket,
                title: "Lightning Fast",
                desc: "Our advanced servers process videos instantly. No waiting queues or slow downloads.",
              },
              {
                icon: FaShieldAlt,
                title: "100% Secure",
                desc: "No data collection, no malicious ads. Your privacy is our top priority.",
              },
              {
                icon: FaCheckCircle,
                title: "High Quality",
                desc: "Download in HD, 1080p, and 4K quality. Crystal clear audio extraction.",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-colors"
              >
                <feature.icon className="text-4xl text-purple-400 mb-6" />
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEO Content & FAQ (Below the fold) */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-gray-400">
        <div className="prose prose-invert max-w-none">
          <h2 className="text-3xl text-white font-bold mb-6">
            Best YouTube Downloader and MP3 Converter
          </h2>
          <p>
            VidFlow is the premier tool for downloading videos from YouTube.
            Whether you need to save a tutorial for offline viewing or convert a
            music video to MP3 for your playlist, VidFlow makes it simple, fast,
            and free.
          </p>

          <h3 className="text-2xl text-white font-bold mt-12 mb-6">
            Frequently Asked Questions
          </h3>
          <div className="space-y-8">
            <div>
              <h4 className="text-xl text-white font-semibold mb-2">
                Is VidFlow free to use?
              </h4>
              <p>
                Yes, VidFlow is completely free. You can download as many videos
                as you want without any hidden costs.
              </p>
            </div>
            <div>
              <h4 className="text-xl text-white font-semibold mb-2">
                Can I download videos on my phone?
              </h4>
              <p>
                Absolutely. VidFlow is optimized for all devices including
                Android, iPhone, Mac, and Windows PC.
              </p>
            </div>
            <div>
              <h4 className="text-xl text-white font-semibold mb-2">
                Is it safe?
              </h4>
              <p>
                Yes, we do not store any of your data or downloaded files. The
                connection is secure and private.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 text-center text-gray-500 text-sm">
        <p className="mb-4">© 2026 VidFlow. All rights reserved.</p>
        <p>
          Disclaimer: VidFlow is not affiliated with YouTube. Please respect
          copyright laws.
        </p>
      </footer>
    </main>
  );
}
