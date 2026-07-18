declare global {
  interface Window {
    google?: any;
    __gmapsLoaded?: Promise<any>;
  }
}

let loadingPromise: Promise<any> | null = null;

export function loadGoogleMaps(
  libraries: string[] = []
): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window is undefined"));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return Promise.reject(
      new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not defined")
    );
  }

  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");

    const params = new URLSearchParams({
      key: apiKey,
      v: "weekly",
    });

    if (libraries.length) {
      params.set("libraries", libraries.join(","));
    }

    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve(window.google);
    script.onerror = () =>
      reject(new Error("Failed to load Google Maps"));

    document.head.appendChild(script);
  });

  return loadingPromise;
}
