import cloudinary from "../config/cloudinary.config";

class cloudinaryService {
  uploadImage = async (data: Buffer, fileName: string, folderName?: string) => {
    try {
      const base64Image = data.toString("base64");
      const dataURI = `data:image/png;base64,${base64Image}`;
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: folderName || "QRCodes",
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
