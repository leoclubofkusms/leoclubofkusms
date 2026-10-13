import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type ViewerPhoto = { src: string; alt: string };

function isViewableImage(image: HTMLImageElement) {
  const src = image.currentSrc || image.src;
  return Boolean(
    src &&
      image.dataset.photoViewer !== "off" &&
      !image.closest("[data-global-photo-viewer]") &&
      !src.startsWith("data:image/svg+xml")
  );
}

export default function GlobalPhotoViewer() {
  const [photos, setPhotos] = useState<ViewerPhoto[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const isOpen = photos.length > 0;

  useEffect(() => {
    const prepareImages = (root: ParentNode = document) => {
      root.querySelectorAll("img").forEach((image) => {
        if (!(image instanceof HTMLImageElement) || !isViewableImage(image)) return;
        if (!image.hasAttribute("tabindex")) image.tabIndex = 0;
        if (!image.hasAttribute("role")) image.setAttribute("role", "button");
        if (!image.hasAttribute("aria-label")) {
          image.setAttribute("aria-label", `View photo: ${image.alt || "image"}`);
        }
      });
    };
    prepareImages();

    const observer = new MutationObserver((records) => {
      records.forEach((record) =>
        record.addedNodes.forEach((node) => {
          if (node instanceof HTMLImageElement) prepareImages(node.parentNode ?? document);
          else if (node instanceof HTMLElement) prepareImages(node);
        })
      );
    });
    observer.observe(document.body, { childList: true, subtree: true });

    function openPhoto(image: HTMLImageElement) {
      if (!isViewableImage(image)) return;
      let gallery: HTMLElement | null = image.closest<HTMLElement>("[data-photo-gallery]");
      if (!gallery) {
        for (let ancestor = image.parentElement; ancestor && ancestor !== document.body; ancestor = ancestor.parentElement) {
          const images = Array.from(ancestor.querySelectorAll("img")).filter(
            (candidate): candidate is HTMLImageElement =>
              candidate instanceof HTMLImageElement && isViewableImage(candidate)
          );
          if (images.length > 1) {
            gallery = ancestor;
            break;
          }
        }
      }

      const images = gallery
        ? Array.from(gallery.querySelectorAll("img")).filter(
            (candidate): candidate is HTMLImageElement =>
              candidate instanceof HTMLImageElement && isViewableImage(candidate)
          )
        : [image];
      const nextPhotos = images.map((candidate) => ({
        src: candidate.currentSrc || candidate.src,
        alt: candidate.alt || "Club photo",
      }));
      const selected = nextPhotos.findIndex(
        (photo) => photo.src === (image.currentSrc || image.src)
      );
      setPhotos(nextPhotos);
      setActiveIndex(Math.max(selected, 0));
    }

    function onClick(event: MouseEvent) {
      const image = (event.target as HTMLElement | null)?.closest("img");
      if (!(image instanceof HTMLImageElement) || !isViewableImage(image)) return;
      event.preventDefault();
      event.stopPropagation();
      openPhoto(image);
    }

    function onKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLImageElement && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        openPhoto(target);
      }
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPhotos([]);
      else if (event.key === "ArrowRight") setActiveIndex((index) => (index + 1) % photos.length);
      else if (event.key === "ArrowLeft") setActiveIndex((index) => (index - 1 + photos.length) % photos.length);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, photos.length]);

  if (!isOpen) return null;
  const activePhoto = photos[activeIndex];

  return (
    <div
      data-global-photo-viewer
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={() => setPhotos([])}
    >
      <button
        type="button"
        onClick={() => setPhotos([])}
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        aria-label="Close photo viewer"
      >
        <X size={21} />
      </button>
      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setActiveIndex((index) => (index - 1 + photos.length) % photos.length);
            }}
            className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-6"
            aria-label="Previous photo"
          >
            <ChevronLeft size={25} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setActiveIndex((index) => (index + 1) % photos.length);
            }}
            className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-6"
            aria-label="Next photo"
          >
            <ChevronRight size={25} />
          </button>
        </>
      )}
      <figure className="flex max-h-full max-w-full flex-col items-center gap-4" onClick={(event) => event.stopPropagation()}>
        <img
          src={activePhoto.src}
          alt={activePhoto.alt}
          className="max-h-[82vh] max-w-full rounded-xl object-contain shadow-2xl"
        />
        <figcaption className="text-center text-sm text-white/75">
          {activePhoto.alt}
          {photos.length > 1 && <span className="ml-2 text-white/45">{activeIndex + 1} / {photos.length}</span>}
        </figcaption>
      </figure>
    </div>
  );
}
