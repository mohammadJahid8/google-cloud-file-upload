"use client";

import Image from "next/image";
import { useState } from "react";
import { FormEvent } from "react";

interface FileUploadResponse {
  message: string;
  results?: string[];
  error?: string;
}

export default function Home() {
  const [images, setImages] = useState<FileList | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImages(e.target.files);

      const imagePreviews = files.map((file) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        return new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
        });
      });

      Promise.all(imagePreviews).then((urls) => setPreviews(urls));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!images || images.length === 0) {
      alert("Please select files");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    for (let i = 0; i < images.length; i++) {
      formData.append("file", images[i]);
    }

    const res = await fetch("/api", {
      method: "POST",
      body: formData,
    });

    const data: FileUploadResponse = await res.json();

    setLoading(false);
    alert(data.message);
  };
  return (
    <div>
      <form
        className="flex flex-col gap-3 items-center min-h-96 justify-center"
        onSubmit={handleSubmit}
      >
        <div className="max-w-sm mx-auto w-full">
          <label
            className="block mb-2 text-sm font-medium text-gray-900 "
            htmlFor="image"
          >
            Upload Images
          </label>
          <input
            disabled={loading}
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 "
            aria-describedby="image_help"
            id="image"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
          />
        </div>

        {previews.length > 0 && (
          <div>
            <h3>Selected Images:</h3>
            <div className="flex flex-wrap gap-3">
              {previews.map((src, index) => (
                <Image
                  key={index}
                  src={src}
                  alt={`Preview ${index}`}
                  width={100}
                  height={100}
                  className="rounded-sm object-cover"
                />
              ))}
            </div>
          </div>
        )}

        <button
          disabled={loading}
          type="submit"
          className="w-full max-w-sm mx-auto  text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
        >
          {loading ? "Uploading.." : "Upload"}
        </button>
      </form>
    </div>
  );
}
