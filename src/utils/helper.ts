import mongoose from "mongoose";
import { BadRequestException } from "./exceptions";

type Model<T> = mongoose.Model<T>;

export const getOneByEmail = async <T>(
  model: Model<T>,
  email: string
): Promise<T | null> => {
  return model.findOne({ email });
};
export const getOne = async <T>(
  model: Model<T>,
  id: mongoose.Types.ObjectId
): Promise<T | null> => {
  return model.findById(id);
};

export const getAll = async <T>(
  model: Model<T>,
  options?: any
): Promise<T[] | null> => {
  return model.find(options);
};

export const createOne = async <T>(
  model: Model<T>,
  bodyData: any
): Promise<T | null> => {
  return model.create(bodyData);
};

export const updateOne = async <T extends Document>(
  model: Model<T>,
  id: mongoose.Types.ObjectId,
  updateData: Partial<T>
): Promise<T | null> => {
  const keys: string[] = Object.keys(updateData);

  const updatedDocument = await model.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  return updatedDocument;
};

export const upsertOne = async <T extends Document>(
  model: Model<T>,
  id: mongoose.Types.ObjectId,
  updateData: any
): Promise<T | null> => {
  return await model.findOneAndUpdate(
    { _id: id, isActive: true },
    { $set: updateData },
    { new: true }
  );
};

export const deleteOne = async <T extends Document>(
  model: Model<T>,
  id: mongoose.Types.ObjectId
): Promise<string> => {
  const deletedDocument = await model.findByIdAndDelete(id).exec();

  if (!deletedDocument) {
    throw new BadRequestException("Failed! Error during delete operation.");
  }

  return "Delete operation completed successfully.";
};
