'use client'
import React, { ChangeEvent, useState, useEffect } from "react";
import { RxCross2 } from "react-icons/rx";
import Image from "next/image";
import InputBox from "@/components/InputBox";
import { toast } from "react-toastify";
import { useMutation } from "@apollo/client";
import { CREATE_REVIEW, UPDATE_REVIEW } from "@/graphql/query/review.query";
import Popup from "../Popup";
import GalleryModel from "./GalleryModel";

interface IReview {
  id?: string;
  customerName: string;
  slug: string;
  imageUrl: string;
  content: string;
}

interface IType {
  onCancel: () => void;
  selectedData?: IReview | null;
  isEditMode?: boolean;
  refetch?: () => void;
}

const AddReview = ({ onCancel, selectedData, isEditMode, refetch }: IType) => {
  type FormState = {
    customerName: string;
    slug: string;
    imageUrl: string;
    content: string;
  };

  const [form, setForm] = useState<FormState>({
    customerName: "",
    slug: "",
    imageUrl: "",
    content: "",
  });

  const [showGalleryOpen, setShowGalleryOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize form with selectedData when available
  useEffect(() => {
    if (selectedData) {
      setForm({
        customerName: selectedData.customerName || "",
        slug: selectedData.slug || "",
        imageUrl: selectedData.imageUrl || "",
        content: selectedData.content || "",
      });
    }
  }, [selectedData]);

  const [updateReview] = useMutation(UPDATE_REVIEW);
  const [createReview] = useMutation(CREATE_REVIEW);

  const handleOnChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!form.customerName.trim()) {
      toast.error("Customer name is required");
      return false;
    }
    
    if (form.customerName.length > 100) {
      toast.error("Customer name must be less than 100 characters");
      return false;
    }
    
    if (form.slug && !/^[a-z0-9-]+$/.test(form.slug)) {
      toast.error("Slug can only contain lowercase letters, numbers, and hyphens");
      return false;
    }
    
    if (form.content && form.content.length > 1000) {
      toast.error("Content must be less than 1000 characters");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    const inputData = {
      customerName: form.customerName.trim(),
      slug: form.slug.trim(),
      imageUrl: form.imageUrl,
      content: form.content.trim(),
    };

    try {
      if (isEditMode && selectedData?.id) {
        const result = await updateReview({
          variables: {
            id: selectedData.id,
            input: inputData,
          },
        });
        
        if (result.data?.updateReview?.success) {
          toast.success(result.data.updateReview.message || "Review updated successfully");
        } else {
          toast.error(result.data?.updateReview?.message || "Failed to update review");
        }
      } else {
        const result = await createReview({
          variables: { input: inputData },
        });
        
        if (result.data?.createReview?.success) {
          toast.success(result.data.createReview.message || "Review created successfully");
        } else {
          toast.error(result.data?.createReview?.message || "Failed to create review");
        }
      }

      if (refetch) {
        refetch();
      }
      onCancel();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const galleryCloseHandler = () => {
    setShowGalleryOpen(false);
  };

  const handleSelectedImage = (imageUrl: string[]) => {
    const selected = imageUrl[0] || "";
    setForm(prev => ({ ...prev, imageUrl: selected }));
    setShowGalleryOpen(false);
  };

  return (
    <Popup>
      <div className="bg-white w-full max-w-lg relative py-6 px-8 shadow-xl rounded-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEditMode ? "Edit Review" : "Add New Review"}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100"
            disabled={loading}
          >
            <RxCross2 className="size-5" />
          </button>
        </div>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          {/* Customer Name */}
          <InputBox
            onChange={handleOnChange}
            label="Customer Name *"
            name="customerName"
            type="text"
            value={form.customerName}
            placeholder="Enter customer name"
          />

          {/* Slug */}
          <InputBox
            onChange={handleOnChange}
            label="Slug"
            name="slug"
            type="text"
            value={form.slug}
            placeholder="Enter slug (optional)"
          />

          {/* Review Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Content
            </label>
            <textarea
              name="content"
              value={form.content}
              onChange={handleOnChange}
              rows={4}
              placeholder="Enter review text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:opacity-70"
              disabled={loading}
            />
          </div>

          {/* Customer Image */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Customer Image
            </label>
            <div
              onClick={() => !loading && setShowGalleryOpen(true)}
              className={`group relative cursor-pointer w-32 h-32 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg transition-colors ${
                loading ? "opacity-70 cursor-not-allowed" : "hover:border-blue-400"
              }`}
            >
              {form.imageUrl ? (
                <>
                  <Image
                    src={form.imageUrl}
                    alt="customer image"
                    fill
                    className="rounded-lg object-cover"
                    sizes="128px"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 transition-opacity rounded-lg">
                    <span className="text-xs text-white font-medium">
                      Change Image
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <div className="mx-auto text-gray-400 mb-1">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-500">
                    Click to upload customer image
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-70"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-5 py-2.5 rounded-lg text-white transition-colors flex items-center ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading && (
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            {isEditMode ? "Update Review" : "Create Review"}
          </button>
        </div>
      </div>

      {showGalleryOpen && (
        <GalleryModel
          onCancel={galleryCloseHandler}
          onSentSelected={handleSelectedImage}
          mode="single"
        />
      )}
    </Popup>
  );
};

export default AddReview;