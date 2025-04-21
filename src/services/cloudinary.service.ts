import cloudinary from "../config/cloudinary.config";

class cloudinaryService {
  uploadImage = async (dataUri: string, fileName: string) => {
    try {
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: "QRCodes",
        public_id: fileName,
        overwrite: true,
      });
      return result;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };
}

export const CloudinaryService = new cloudinaryService();
