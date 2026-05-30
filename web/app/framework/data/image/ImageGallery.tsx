"use client";

import { useEffect, useState } from "react";
import { useAlert } from "@/framework/ui/useAlert";
import Image, { type ImageMeta } from "@/framework/data/image/Image";

type ImageMetaWithDate = ImageMeta & { createdAt: string };

type Props = {
  refreshKey?: number;
};

export default function ImageGallery({ refreshKey = 0 }: Props) {
  const [images, setImages] = useState<ImageMetaWithDate[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/images/list", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load images");
        const data = (await res.json()) as { images: ImageMetaWithDate[] };
        if (!cancelled) setImages(data.images ?? []);
      } catch {
        if (!cancelled) showAlert("Error", "Failed to load images");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  if (loading) {
    return <p className="text-sm text-gray-400 italic">Loading images...</p>;
  }

  if (images.length === 0) {
    return <p className="text-sm text-gray-400 italic">No images uploaded yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      {images.map((image) => (
        <div
          key={image.id}
          className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col"
        >
          <div className="relative w-full h-40 bg-gray-50">
            <Image
              imageId={image.id}
              editable
              meta={image}
              onUpdated={(next) =>
                setImages((prev) =>
                  prev.map((i) => (i.id === next.id ? { ...i, ...next } : i))
                )
              }
            />
          </div>
          <div className="px-3 py-2 text-sm text-gray-700 truncate">
            {image.alt ?? <span className="text-gray-400 italic">No alt text</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
