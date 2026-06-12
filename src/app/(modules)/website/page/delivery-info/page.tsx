"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_PAGE_CONTENT,
  UPDATE_PAGE_CONTENT,
} from "@/graphql/query/page.query";
import { toast } from "react-toastify";
import { useAppSelector } from "@/redux/hooks";

const ToastEditor = dynamic(() => import("@/components/RichTextEditor"), {
  ssr: false,
});

const Page = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempContent, setTempContent] = useState("");
  const [pageId, setPageId] = useState("");
  const currentUser = useAppSelector((state) => state.currentUser.user);
  
  // Get page content query
  const { loading, error, data, refetch } = useQuery(GET_PAGE_CONTENT, {
    variables: { slug: "delivery-info" },
  });

  // Move state updates to useEffect to avoid render-phase updates
  useEffect(() => {
    if (data?.getPageContent?.success && data.getPageContent.data) {
      setTempContent(data.getPageContent.data.content || "");
      setPageId(data.getPageContent.data._id);
    }
  }, [data]); // This will run after the component has mounted

  // Update page content mutation
  const [updatePageContent, { loading: updating }] = useMutation(
    UPDATE_PAGE_CONTENT,
    {
      onCompleted: (result) => {
        if (result.updatePageContent.success) {
          setIsEditing(false);
          refetch(); // Refetch to get updated data
          toast.success("Page updated successfully!");
        } else {
          toast.error(result.updatePageContent.message || "Failed to update page");
        }
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update page");
      },
    }
  );

  const handleSave = () => {
    if (!pageId) {
      console.error("No page ID available");
      toast.error("No page ID available");
      return;
    }

    updatePageContent({
      variables: {
        id: pageId,
        input: {
          slug: "delivery-info",
          content: tempContent,
          author: currentUser?._id,
        },
      },
    });
  };

  const handleCancel = () => {
    // Reset to original content from server
    if (data?.getPageContent?.data?.content) {
      setTempContent(data.getPageContent.data.content);
    }
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleContentChange = (newContent: string) => {
    setTempContent(newContent);
  };

  // Function to convert markdown to HTML for display
  const renderContent = (markdown: string) => {
    if (!markdown) return "<p>No content available</p>";

    return markdown
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold my-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold my-3">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold my-2">$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
      .replace(/\*(.*)\*/gim, "<em>$1</em>")
      .replace(/\n\n/gim, "</p><p>")
      .replace(/\n/gim, "<br/>")
      .replace(/<p>(.*?)<\/p>/gim, '<p class="mb-4">$1</p>');
  };

  if (loading) {
    return (
      <div className="px-6">
        <div className="bg-white rounded-md ring-1 ring-gray-200 overflow-hidden">
          <div className="flex justify-between items-center p-4">
            <h1 className="text-xl">Delivery Info</h1>
          </div>
          <div className="p-6 text-center">
            <div className="animate-pulse">Loading content...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6">
        <div className="bg-white rounded-md ring-1 ring-gray-200 overflow-hidden">
          <div className="flex justify-between items-center p-4">
            <h1 className="text-xl">Delivery Info</h1>
          </div>
          <div className="p-6 text-center text-red-600">
            Error loading page content: {error.message}
          </div>
        </div>
      </div>
    );
  }

  const pageData = data?.getPageContent?.data;
  const currentContent = pageData?.content || tempContent || "# Welcome to Our Website\n\nThis is the about page content. You can edit this section by clicking the 'Edit Content' button.";

  return (
    <div className="px-6">
      <div className="bg-white rounded-md ring-1 ring-gray-200 overflow-hidden">
        <div className="flex justify-between items-center p-4 text-black">
          <h1 className="text-xl">Delivery Info</h1>
          {!isEditing && pageData && (
            <button
              onClick={handleEdit}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg transition-colors text-sm flex items-center shadow-md disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit Content
            </button>
          )}
        </div>

        <div className="p-2">
          {isEditing ? (
            <div className="space-y-6">
              <div className="border border-gray-300  rounded-lg h-[400px] overflow-y-auto  shadow-sm">
                <ToastEditor
                  initialValue={tempContent}
                  onChange={handleContentChange}
                  theme="light"
                />
              </div>
            </div>
          ) : (
            <div className="prose max-w-none  h-[400px] overflow-y-auto  p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div
                dangerouslySetInnerHTML={{
                  __html: renderContent(currentContent),
                }}
              />
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
          {isEditing ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2 animate-pulse"></div>
                <span>Editing mode</span>
                {updating && <span className="ml-4">Saving...</span>}
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancel}
                  disabled={updating}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm shadow-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={updating || !tempContent.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm shadow-md disabled:opacity-50"
                >
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span>
                Last updated:{" "}
                {pageData?.updatedAt
                  ? new Date(pageData.updatedAt).toLocaleDateString()
                  : "Never"}
              </span>
              {pageData?.author && (
                <span>Author: {pageData.author.username}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;