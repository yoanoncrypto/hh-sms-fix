import { useState } from "react";
import { supabase } from "../lib/supabase";

interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  url: string | null;
}

export const useStorageUpload = () => {
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    url: null,
  });

  const validateFile = (file: File): string | null => {
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return "File size must be less than 5MB";
    }

    // Check file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      return "File must be an image (JPEG, PNG, GIF, or WebP)";
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadState((prev) => ({ ...prev, error: validationError }));
      return null;
    }

    setUploadState({
      uploading: true,
      progress: 0,
      error: null,
      url: null,
    });

    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      const filePath = `campaigns/${fileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from("campaign_images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("campaign_images").getPublicUrl(data.path);

      setUploadState({
        uploading: false,
        progress: 100,
        error: null,
        url: publicUrl,
      });

      return publicUrl;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      setUploadState({
        uploading: false,
        progress: 0,
        error: errorMessage,
        url: null,
      });
      return null;
    }
  };

  const clearUpload = () => {
    setUploadState({
      uploading: false,
      progress: 0,
      error: null,
      url: null,
    });
  };

  return {
    uploadState,
    uploadFile,
    clearUpload,
    validateFile,
  };
};
