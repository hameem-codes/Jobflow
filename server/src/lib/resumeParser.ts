import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { ApiError } from "./ApiError.js";
import { logger } from "./logger.js";

export class ResumeParser {
  /**
   * Extracts plain text from a PDF or DOCX buffer.
   */
  static async extractText(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
    const lowerFilename = filename.toLowerCase();
    const isPdf = mimeType === "application/pdf" || lowerFilename.endsWith(".pdf");
    const isDocx =
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword" ||
      lowerFilename.endsWith(".docx") ||
      lowerFilename.endsWith(".doc");

    if (!isPdf && !isDocx) {
      throw ApiError.badRequest("Invalid file format. Only PDF and DOCX files are allowed.");
    }

    try {
      if (isPdf) {
        const uint8Data = new Uint8Array(buffer);
        const parser = new PDFParse(uint8Data);
        const parsed = await parser.getText();
        const text = parsed && parsed.text ? parsed.text.trim() : "";
        if (!text) {
          logger.warn({ filename }, "PDF parse resulted in empty text output");
        }
        return text;
      } else {
        const result = await mammoth.extractRawText({ buffer });
        const text = result && result.value ? result.value.trim() : "";
        if (!text) {
          logger.warn({ filename }, "DOCX parse resulted in empty text output");
        }
        return text;
      }
    } catch (error: any) {
      logger.error({ err: error, filename, mimeType }, "Failed to extract text from resume file");
      throw ApiError.badRequest(`Failed to parse resume content: ${error.message || "Unknown error"}`);
    }
  }
}
