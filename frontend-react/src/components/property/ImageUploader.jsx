import React, { useState } from "react";
import imageCompression from "browser-image-compression";

/**
 * ImageUploader handles image selection, browser-side compression, and preview rendering.
 *
 * @param {Array} images - Array of File objects currently selected
 * @param {Function} setImages - Setter for images array
 * @param {Array} previewUrls - Array of string URLs for image previews
 * @param {Function} setPreviewUrls - Setter for preview URLs
 * @param {Function} setMessage - Setter for error/success messages
 */
const ImageUploader = ({
  images,
  setImages,
  previewUrls,
  setPreviewUrls,
  setMessage,
}) => {
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 10) {
      setMessage({
        type: "error",
        text: "You can only upload a maximum of 10 images.",
      });
      return;
    }
    setMessage({ type: "", text: "" });
    setLoading(true);

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };
    
    const newCompressedImages = [];
    const newPreviewUrls = [];

    try {
      const compressedResults = await Promise.all(
        files.map(async (file) => {
          const compressedFile = await imageCompression(file, options);
          return {
            file: compressedFile,
            url: URL.createObjectURL(compressedFile),
          };
        })
      );

      newCompressedImages.push(...compressedResults.map((res) => res.file));
      newPreviewUrls.push(...compressedResults.map((res) => res.url));
    } catch (error) {
      console.error("Error compressing images:", error);
      setMessage({ type: "error", text: "Failed to compress some images." });
    }

    setImages([...images, ...newCompressedImages]);
    setPreviewUrls([...previewUrls, ...newPreviewUrls]);
    setLoading(false);
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
    setPreviewUrls(previewUrls.filter((_, index) => index !== indexToRemove));
  };

  return (
    <>
      <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">
        Media <span className="text-red-500">*</span>
      </h3>

      <div className="mb-4 relative border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 transition-colors bg-gray-50 flex flex-col items-center justify-center cursor-pointer">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={loading}
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-gray-400 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-sm font-bold text-blue-600 mb-1">
          Click to upload or drag and drop
        </p>
        <p className="text-xs text-gray-500">
          JPG, PNG up to 10 images (Min 1)
        </p>
        {loading && (
          <p className="text-blue-600 text-sm font-bold mt-4 animate-pulse">
            Processing...
          </p>
        )}
      </div>

      {previewUrls.length > 0 && (
        <div className="mb-8 p-4 bg-white rounded-lg border border-gray-200 shadow-inner">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold text-gray-700">
              {previewUrls.length} / 10 Images Selected
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {previewUrls.map((url, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 shadow-sm group"
              >
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-gray-500 hover:text-red-600 hover:bg-white shadow-md transition-all opacity-0 group-hover:opacity-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default ImageUploader;
