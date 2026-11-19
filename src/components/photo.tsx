"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/catalogue";

interface PhotoProps {
  src: string;
  alt: string;
  tone?: Tone;
  focal?: string;
  className?: string;
  sizes?: string;
  /** Above-the-fold image: loads eagerly and skips the scroll reveal (the hero has its own entrance). */
  priority?: boolean;
  /** Small utility thumbnails (bag, checkout, room scene): no scroll reveal or parallax. */
  plain?: boolean;
  /** @deprecated every photo now has the cinematic hover. Kept so existing call sites compile. */
  zoom?: boolean;
}

/** Each photograph arrives its own way. The style is picked per instance, stable between server and client. */
const REVEALS = ["up", "down", "left", "right", "curtain", "blur"] as const;

function hash(s: string) {
  let x = 0;
  for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(x);
}

/**
 * Cinematic photograph:
 *  - arrives on scroll with one of several reveals (assigned at random per image)
 *  - drifts slowly against the scroll (parallax) where the browser supports scroll-driven animation
 *  - slow push-in, tonal lift and vignette on hover
 * A tonal placeholder sits underneath so layout never looks empty while the file loads.
 */
export function Photo({ src, alt, tone = "earth", focal, className, sizes, priority, plain }: PhotoProps) {
  const id = useId();
  const h = hash(id + src);
  const variant = REVEALS[h % REVEALS.length];
  const delay = ((h >> 4) % 4) * 90;

  const root = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [shown, setShown] = useState(Boolean(priority || plain));

  useEffect(() => {
    if (shown) return;
    const el = root.current;
    if (!el || !("IntersectionObserver" in window)) {
      setShown(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -6% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [shown]);

  return (
    <div
      ref={root}
      className={cn("cine relative isolate overflow-hidden", `cine-${variant}`, shown ? "cine-in" : "cine-pending", className)}
    >
      <div className="cine-clip bg-[#cccac2]" style={{ transitionDelay: shown && !plain && !priority ? `${delay}ms` : undefined }}>
      <div className={cn("fallback transition-opacity duration-500", tone, loaded && "opacity-0")} aria-hidden />
      <div className={cn("absolute inset-x-0", plain ? "inset-y-0" : "cine-par -inset-y-[7%]")}>
        <div className="cine-scale absolute inset-0">
          {!failed && (
            <Image
              ref={(el) => {
                if (el?.complete && el.naturalWidth > 0) setLoaded(true);
              }}
              src={src}
              alt={alt}
              fill
              unoptimized
              loading={priority ? "eager" : undefined}
              fetchPriority={priority ? "high" : undefined}
              sizes={sizes ?? "(max-width: 768px) 100vw, 50vw"}
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
              className={cn("object-cover transition-opacity duration-500", loaded ? "opacity-100" : "opacity-0")}
              style={{ objectPosition: focal }}
            />
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
