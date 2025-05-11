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

  uploadImageIfExists = async (
    file: Express.Multer.File | undefined,
    folder: string
  ) => {
    if (!file) return undefined;
    const uploaded = await this.uploadImage(
      file.buffer,
      file.originalname,
      folder
    );
    return uploaded?.url;
  };
}

export const CloudinaryService = new cloudinaryService();
