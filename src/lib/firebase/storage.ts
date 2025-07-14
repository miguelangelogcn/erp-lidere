import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "./client";

const storage = getStorage(app);

/**
 * Uploads a file to Firebase Storage.
 * @param path The path where the file will be stored (e.g., "mentorships/videos/file.mp4").
 * @param file The file object to upload.
 * @returns A promise that resolves with the download URL of the uploaded file.
 */
export const uploadFile = async (path: string, file: File): Promise<string> => {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
};
