"use client";
import { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";

export default function Home() {
  const [images, setImages] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previousGrid, setPreviousGrid] = useState(null);
  const [showPrevModal, setShowPrevModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const previewRef = useRef(null);
  const hiddenPreviewRef = useRef(null);

  // Load previous grid from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("dumpgrid_previous");
    if (stored) setPreviousGrid(stored);
  }, []);

  // Save previous grid to localStorage when it changes
  useEffect(() => {
    if (previousGrid) {
      localStorage.setItem("dumpgrid_previous", previousGrid);
    }
  }, [previousGrid]);

  // Preload images for better rendering
  useEffect(() => {
    const preloadImages = async () => {
      await Promise.allimages.map(src => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = src;
          img.onload = resolve;
          img.onerror = resolve;
        });
      });
    };
    preloadImages();
  }, [images]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (images.length >= 12) {
      alert("Maximum 12 photos allowed.");
      return;
    }
    const url = URL.createObjectURL(file);
    setImages((prev) => [...prev, url]);
    setCurrentFile(null); // reset input
  };

  const handleAddPhotoClick = () => {
    setCurrentFile(Date.now()); // force input re-render
  };

  const handleRemovePhoto = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartNewGrid = () => {
    setImages([]);
    setCurrentFile(null);
    setShowPreview(false);
  };

  const downloadGrid = async () => {
    setIsLoading(true);
    const ref = showPreview ? previewRef : hiddenPreviewRef;
    if (!ref.current) {
      setIsLoading(false);
      return;
    }
    
    // If using hidden div, wait briefly for layout
    if (!showPreview) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    try {
      const canvas = await html2canvas(ref.current, {
        backgroundColor: null,
        useCORS: true,
        scale: 2, // Double the resolution for better quality
        logging: false,
        allowTaint: true,
        onclone: (clonedDoc) => {
          // Ensure cloned elements maintain proper sizing
          const clonedRef = clonedDoc.getElementById(ref.current.id);
          if (clonedRef) {
            clonedRef.style.width = `${ref.current.offsetWidth}px`;
            clonedRef.style.height = `${ref.current.offsetHeight}px`;
          }
        }
      });
      
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      setPreviousGrid(dataUrl);
      
      const link = document.createElement('a');
      link.download = 'dumpgrid.png';
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error generating image:", error);
      alert("Error generating image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br font-plus from-gray-900 via-black to-gray-800 text-white flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-2xl mx-auto bg-black/70 rounded-xl shadow-lg p-8 flex flex-col items-center">
        <h1 className="text-4xl font-extrabold text-center mb-8 tracking-tight bg-gradient-to-r from-blue-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          DumpGrid 🧩
        </h1>
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="flex flex-col items-center gap-2 w-full">
            <span className="text-sm text-gray-300 mb-2">
              {images.length < 2
                ? `Select at least ${2 - images.length} more photo(s)`
                : images.length < 12
                ? `You can add up to ${12 - images.length} more photo(s)`
                : "Maximum photos reached"}
            </span>
            {images.length < 12 && (
              <>
                <button
                  onClick={handleAddPhotoClick}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-5 py-2 rounded-lg cursor-pointer font-semibold shadow transition"
                >
                  Add Photo
                </button>
                {currentFile && (
                  <input
                    key={currentFile}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="bg-white text-black p-2 rounded mt-2 mx-4 text-sm"
                  />
                )}
              </>
            )}
          </div>
          {images.length > 0 && (
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {images.map((src, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={src}
                    alt={`Selected ${idx + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border-2 border-gray-700 shadow-md"
                  />
                  <button
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-0 right-0 bg-red-600 text-white cursor-pointer rounded-full px-2 py-0 text-xs opacity-80 group-hover:opacity-100 transition"
                    style={{ transform: "translate(30%,-30%)" }}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {/* Only show grid and download if at least 2 images */}
          {images.length >= 2 && (
            <div className="flex flex-col items-center w-full mt-6 gap-4">
              <button
                onClick={() => setShowPreview(true)}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white cursor-pointer px-6 py-2 rounded-lg font-semibold shadow transition"
              >
                Preview Grid 👀
              </button>
              <button
                onClick={downloadGrid}
                disabled={isLoading}
                className={`bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white cursor-pointer px-6 py-2 rounded-lg font-semibold shadow transition ${isLoading ? 'opacity-70' : ''}`}
              >
                {isLoading ? 'Generating...' : 'Download Dump 📥'}
              </button>
              {previousGrid && (
                <button
                  onClick={() => setShowPrevModal(true)}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white cursor-pointer px-6 py-2 rounded-lg font-semibold shadow transition"
                >
                  View Previous Grid
                </button>
              )}
              <button
                onClick={handleStartNewGrid}
                className="bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black text-white cursor-pointer px-6 py-2 rounded-lg font-semibold shadow transition"
              >
                Start New Grid
              </button>
            </div>
          )}
          {/* Show previous grid button if no current grid but previous exists */}
          {images.length === 0 && previousGrid && (
            <button
              onClick={() => setShowPrevModal(true)}
              className="bg-gradient-to-r cursor-pointer from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-2 rounded-lg font-semibold shadow transition mt-6"
            >
              View Previous Grid
            </button>
          )}
          {/* Hidden grid for download when modal is closed */}
          <div
            style={{
              position: "fixed",
              left: -9999,
              top: -9999,
              pointerEvents: "none",
              width: "600px",
              height: "auto"
            }}
          >
            <div
              ref={hiddenPreviewRef}
              id="hidden-grid"
              className={`grid ${
                images.length <= 4
                  ? "grid-cols-2"
                  : images.length <= 6
                  ? "grid-cols-3"
                  : images.length <= 9
                  ? "grid-cols-3"
                  : "grid-cols-4"
              }`}
              style={{
                gap: 0,
                background: "transparent",
                borderRadius: "0.75rem",
                overflow: "hidden",
                width: "100%",
                height: "auto"
              }}
            >
              {images.map((src, index) => (
                <img
                  key={index}
                  src={src}
                  alt={`Dump image ${index + 1}`}
                  className="w-full"
                  style={{
                    borderRadius: 0,
                    boxShadow: "none",
                    margin: 0,
                    width: "100%",
                    height: "160px",
                    objectFit: "cover",
                    display: "block"
                  }}
                  crossOrigin="anonymous"
                />
              ))}
            </div>
          </div>
          {/* Preview Modal */}
          {showPreview && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
              <div className="relative bg-black rounded-xl shadow-2xl p-4">
                <button
                  onClick={() => setShowPreview(false)}
                  className="absolute cursor-pointer top-2 right-2 bg-red-600 text-white rounded-full px-3 py-1 text-lg font-bold"
                  title="Close"
                >
                  ×
                </button>
                <div
                  ref={previewRef}
                  id="preview-grid"
                  className={`grid ${
                    images.length <= 4
                      ? "grid-cols-2"
                      : images.length <= 6
                      ? "grid-cols-3"
                      : images.length <= 9
                      ? "grid-cols-3"
                      : "grid-cols-4"
                  }`}
                  style={{
                    gap: 0,
                    background: "transparent",
                    borderRadius: "0.75rem",
                    overflow: "hidden",
                    width: "600px",
                    maxWidth: "90vw"
                  }}
                >
                  {images.map((src, index) => (
                    <img
                      key={index}
                      src={src}
                      alt={`Dump image ${index + 1}`}
                      className="w-full"
                      style={{
                        borderRadius: 0,
                        boxShadow: "none",
                        margin: 0,
                        width: "100%",
                        height: "160px",
                        objectFit: "cover",
                        display: "block"
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* Previous Grid Modal */}
          {showPrevModal && previousGrid && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
              <div className="relative bg-black rounded-xl shadow-2xl p-4 flex flex-col items-center">
                <button
                  onClick={() => setShowPrevModal(false)}
                  className="absolute top-2 right-2 cursor-pointer bg-red-600 text-white rounded-full px-3 py-1 text-lg font-bold"
                  title="Close"
                >
                  ×
                </button>
                <img
                  src={previousGrid}
                  alt="Previous DumpGrid"
                  className="max-w-full max-h-[70vh] rounded-lg shadow-lg"
                  style={{ background: "transparent" }}
                />
                <a
                  href={previousGrid}
                  download="dumpgrid.png"
                  className="mt-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 cursor-pointer text-white px-6 py-2 rounded-lg font-semibold shadow transition"
                >
                  Download Again
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* App description and author */}
      <div className="mt-8 text-center text-gray-300 text-sm max-w-xl">
        <p className="mx-2">
          <strong>DumpGrid</strong> lets you easily create and download a grid collage from 2 to 12 of your favorite photos. 
          Select your images, preview the grid, and save it as a transparent PNG. Your last grid is always available in your browser for quick access.
        </p>
        <p className="mt-4">
          Made with evil by <a href="https://github.com/ChidiebereMichael18" target="_blank" rel="noopener noreferrer" className="underline hover:text-white"> IFearAids</a>
        </p>
        <div className="my-4 flex justify-center">
          <a
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold cursor-pointer px-4 py-2 rounded-lg shadow transition"
            onClick={() => alert("Bank Account: Palmpay \nAccount Number: 8120414388")}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M17 19c0 1.104-.895 2-2 2H9c-1.105 0-2-.896-2-2V7h10v12zM19 7V5c0-1.104-.895-2-2-2H7C5.895 3 5 3.896 5 5v2H2v2h2v12c0 2.209 1.791 4 4 4h6c2.209 0 4-1.791 4-4V9h2V7h-3z" fill="#000"/>
            </svg>
            Buy Me a Coffee
          </a>
        </div>
      </div>
    </div>
  );
}