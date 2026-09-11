import { supabaseAdmin } from "../lib/supabase.js";
import { logger } from "../lib/logger.js";
import { ApiError } from "../lib/ApiError.js";

export class StorageService {
  /**
   * Upload a file to a Supabase storage bucket
   */
  static async uploadFile(
    bucket: string,
    path: string,
    fileBuffer: Buffer,
    contentType: string,
    options: { upsert?: boolean } = { upsert: false }
  ): Promise<string> {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(path, fileBuffer, {
          contentType,
          upsert: options.upsert,
        });

      if (error) {
        logger.error({ err: error, bucket, path }, "Failed to upload file to Supabase Storage");
        throw ApiError.internal("Failed to upload file");
      }

      return data.path;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error({ err: error, bucket, path }, "Unexpected error during file upload");
      throw ApiError.internal("Failed to upload file");
    }
  }

  /**
   * Delete a file from a Supabase storage bucket
   */
  static async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);

      if (error) {
        logger.error({ err: error, bucket, path }, "Failed to delete file from Supabase Storage");
        throw ApiError.internal("Failed to delete file");
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error({ err: error, bucket, path }, "Unexpected error during file deletion");
      throw ApiError.internal("Failed to delete file");
    }
  }

  /**
   * Get a signed URL for temporary access to a private file
   */
  static async getSignedUrl(bucket: string, path: string, expiresIn: number = 3600): Promise<string> {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error || !data) {
        logger.error({ err: error, bucket, path }, "Failed to create signed URL");
        throw ApiError.internal("Failed to generate file access URL");
      }

      return data.signedUrl;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error({ err: error, bucket, path }, "Unexpected error during signed URL generation");
      throw ApiError.internal("Failed to generate file access URL");
    }
  }

  /**
   * Get the public URL for a file in a public bucket
   */
  static getPublicUrl(bucket: string, path: string): string {
    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Upload a resume file to Supabase storage bucket
   */
  static async uploadResume(
    userId: string,
    filename: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<{ path: string; publicUrl: string }> {
    const bucket = "resumes";
    const sanitizeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userId}/${Date.now()}_${sanitizeName}`;

    const uploadPath = await this.uploadFile(bucket, path, fileBuffer, contentType, { upsert: true });
    const publicUrl = this.getPublicUrl(bucket, uploadPath);
    return { path: uploadPath, publicUrl };
  }
}
