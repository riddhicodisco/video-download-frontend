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
import { FaShieldAlt, FaPlus, FaMinus } from "react-icons/fa";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const FAQ_ITEMS = [
  {
    question: "Is VidNest free to use?",
    answer:
      "Yes, VidNest is completely free. You can download as many videos as you want without any hidden costs or forced registrations. We believe in keeping the 'flow' simple and accessible for everyone.",
  },
  {
    question: "Can I download videos on my phone?",
    answer:
      "Absolutely! VidNest is fully responsive and optimized for all devices. Whether you're on an Android, iPhone, Mac, or Windows PC, you can enjoy seamless video and audio downloads directly from your browser.",
  },
  {
    question: "Is it safe to download from VidNest?",
    answer:
      "Security is our top priority. We do not store any of your personal data or downloaded files on our servers. The connection is encrypted, and we ensure a clean, ad-free experience to protect your device from malicious software.",
  },
  {
    question: "What video formats and resolutions are supported?",
    answer:
      "We currently support high-quality MP4 video downloads up to 1080p and crystal clear MP3 audio extraction. We're constantly working on adding support for even higher resolutions like 4K and more formats.",
  },
  {
    question: "How long does it take to process a download?",
    answer:
      "Most videos are processed instantly! However, for longer videos or 4K content, it might take a few extra seconds to ensure the best quality. Our advanced server-side processing ensures you get your files as fast as possible.",
  },
];

function FAQItem({
  question,
  answer,
  isOpen,
  onClick,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div className="border-b border-white/10 last:border-0">
      <button
        onClick={onClick}
        className="w-full py-6 flex items-center justify-between text-left group focus:outline-none"
      >
        <span
          className={`text-lg md:text-xl font-semibold transition-colors ${isOpen ? "text-purple-400" : "text-white group-hover:text-purple-300"
            }`}
        >
          {question}
        </span>
        <div
          className={`flex-shrink-0 ml-4 w-8 h-8 rounded-full border border-white/10 flex items-center justify-center transition-all ${isOpen ? "bg-purple-600/20 border-purple-500/50" : "bg-white/5"
            }`}
        >
          {isOpen ? (
            <FaMinus className="text-sm text-purple-400" />
          ) : (
            <FaPlus className="text-sm text-gray-400" />
          )}
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 pb-6 opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <p className="text-gray-400 leading-relaxed text-base md:text-lg">
          {answer}
        </p>
      </div>
    </div>
  );
}

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
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(0);


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
            name: "VidNest",
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

          <div className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt="VidNest Logo"
              width={200}
              height={100}
              className="h-12 md:h-20 w-auto object-contain"
              priority
            />
          </div>
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
            Why Choose VidNest?
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
      <section className="max-w-4xl mx-auto px-6 py-24">
        <div className="prose prose-invert max-w-none mb-20">
          <h2 className="text-3xl md:text-4xl text-white font-bold mb-8 text-center">
            The Ultimate YouTube Downloader
          </h2>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 md:p-12">
            <p className="text-lg text-gray-400 leading-relaxed mb-6">
              VidNest is the premier tool for downloading videos from YouTube.
              Whether you need to save a tutorial for offline viewing, grab a
              presentation for work, or convert a music video to MP3 for your
              personal playlist, VidNest makes it simple, fast, and free.
            </p>
            <p className="text-lg text-gray-400 leading-relaxed">
              Our service is designed with a focus on speed and user privacy. No
              tracking, no intrusive ads, and no complicated setup. Just paste
              the link and let the flow take over.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl text-white font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-400">
              Everything you need to know about VidNest and how it works.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-4 md:p-8">
            {FAQ_ITEMS.map((item, index) => (
              <FAQItem
                key={index}
                question={item.question}
                answer={item.answer}
                isOpen={openFAQIndex === index}
                onClick={() =>
                  setOpenFAQIndex(openFAQIndex === index ? null : index)
                }
              />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 text-center text-gray-500 text-sm">
        <p className="mb-4">© 2026 VidNest. All rights reserved.</p>
        <p>
          Disclaimer: VidNest is not affiliated with YouTube. Please respect
          copyright laws.
        </p>
      </footer>
    </main>
  );
}
