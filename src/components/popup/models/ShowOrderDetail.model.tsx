"use client";
import React, { useState } from "react";
import Popup from "../Popup";
import {
  FiBox,
  FiCalendar,
  FiDownload,
  FiFile,
  FiImage,
  FiLayers,
  FiMail,
  FiMessageSquare,
  FiPackage,
  FiPhone,
  FiUser,
  FiX,
  FiAlertCircle,
} from "react-icons/fi";
import { BsFillArrowUpLeftCircleFill, BsFillPaletteFill } from "react-icons/bs";

interface QuoteData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  stock: string;
  style: string;
  material: string;
  color: string;
  length: number;
  width: number;
  height: number;
  comment: string;
  attachmentUrl: string[];
  createdAt: string;
  updatedAt: string;
}

interface QuotePopupProps {
  quote: QuoteData;
  onClose: () => void;
}

const ShowOrderDetail = ({ quote, onClose }: QuotePopupProps) => {
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      setDownloadError(null);
      setDownloading(filename);
      console.log({url:url})
      console.log({filename:filename})
      
      // Check if the URL is a full URL or a relative path
      let downloadUrl = url;
      if (!url.startsWith('http') && !url.startsWith('blob:') && !url.startsWith('/api/')) {
        // If it's a relative path, prepend the API endpoint
        downloadUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/download?filePath=${encodeURIComponent(url)}`;
      } else if (!url.startsWith('http') && !url.startsWith('blob:')) {
        // If it's already a relative API path, use as is
        downloadUrl = url;
      }
      console.log({downloadUrl:downloadUrl})
      
      // Fetch the file from the server
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error(`File not available: ${response.status} ${response.statusText}`);
      }
      
      // Convert the response to a blob
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || "attachment";
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error: any) {
      console.error("Download error:", error);
      setDownloadError(error.message || "Failed to download file");
    } finally {
      setDownloading(null);
    }
  };

  const getFileIcon = (url: string) => {
    const extension = url.split(".").pop()?.toLowerCase();
    if (
      ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension || "")
    ) {
      return <FiImage className="text-blue-500 text-lg" />;
    }
    return <FiFile className="text-gray-500 text-lg" />;
  };

  const getFileNameFromUrl = (url: string) => {
    return url.split("/").pop() || "Download file";
  };

  return (
    <Popup>
      <div className="bg-white rounded-xl relative px-8 overflow-hidden shadow-md max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FiBox className="text-primary-600" />
            Quote Request Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Download Error Message */}
        {downloadError && (
          <div className="mx-6 mt-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center gap-2">
            <FiAlertCircle />
            {downloadError}
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FiUser className="text-primary-600" />
                Customer Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">{quote.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium flex items-center gap-2">
                    <FiMail className="text-gray-400" />
                    {quote.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact Number</p>
                  <p className="font-medium flex items-center gap-2">
                    <FiPhone className="text-gray-400" />
                    {quote.phone}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FiCalendar className="text-primary-600" />
                Request Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Request Date</p>
                  <p className="font-medium">{formatDate(quote.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="font-medium">
                    {formatDate(quote.updatedAt) || formatDate(quote.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Request ID</p>
                  <p className="font-medium text-sm font-mono">{quote._id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FiPackage className="text-primary-600" />
              Order Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Box Style</p>
                  <p className="font-medium flex items-center gap-2">
                    <FiBox className="text-gray-400" />
                    {quote.style}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Material</p>
                  <p className="font-medium">{quote.material}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Color</p>
                  <p className="font-medium flex items-center gap-2">
                    <BsFillPaletteFill className="text-gray-400" />
                    {quote.color}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Quantity</p>
                  <p className="font-medium flex items-center gap-2">
                    <FiLayers className="text-gray-400" />
                    {quote.stock} units
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dimensions</p>
                  <p className="font-medium flex items-center gap-2">
                    <BsFillArrowUpLeftCircleFill className="text-gray-400" />
                    {quote.length}cm × {quote.width}cm × {quote.height}cm
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Comments */}
          {quote.comment && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FiMessageSquare className="text-primary-600" />
                Additional Comments
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {quote.comment}
              </p>
            </div>
          )}

          {/* Attachments */}
          {quote.attachmentUrl && quote.attachmentUrl.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FiFile className="text-primary-600" />
                Attachments ({quote.attachmentUrl.length})
              </h3>
              <div className="space-y-2">
                {quote.attachmentUrl.map((url, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(url)}
                      <span className="text-sm font-medium truncate max-w-xs">
                        {getFileNameFromUrl(url)}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        handleDownload(url, getFileNameFromUrl(url))
                      }
                      disabled={downloading === getFileNameFromUrl(url)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 px-3 py-1 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {downloading === getFileNameFromUrl(url) ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm font-medium">Downloading...</span>
                        </>
                      ) : (
                        <>
                          <FiDownload className="text-sm" />
                          <span className="text-sm font-medium">Download</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-white border-gray-200 sticky bottom-0">
          <button
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
          </button>
        </div>
      </div>
    </Popup>
  );
};

export default ShowOrderDetail;