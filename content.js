
(() => {
  if (window.__spotifyDynamicPlayer) return;
  window.__spotifyDynamicPlayer = true;

  const PLAYER = '[data-testid="now-playing-bar"]';
  const ART = '[data-testid="cover-art-image"]';
  const BLUR_ID = "spotify-custom-blur";

  function getArtwork(player) {
    const images = [...player.querySelectorAll(ART)];

    // Prefer an image that is actually visible in the player.
    const image = images.find(img => {
      const rect = img.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 &&
        (img.currentSrc || img.src);
    });

    return image ? (image.currentSrc || image.src) : "";
  }

  function apply(player) {
    const art = getArtwork(player);
    if (!art) return;

    // Keep the artwork layer attached to the actual player.
    let bg = player.querySelector(`#${BLUR_ID}`);

    if (!bg) {
      bg = document.createElement("div");
      bg.id = BLUR_ID;
      bg.setAttribute("aria-hidden", "true");

      Object.assign(bg.style, {
        position: "absolute",
        inset: "-20px",
        zIndex: "0",
        pointerEvents: "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        filter: "blur(5px) brightness(0.7)",
        transform: "scale(1.02)"
      });

      player.prepend(bg);
    }

    // Reapply the background when the album artwork changes.
    const image = `url("${art.replace(/["\\]/g, "\\$&")}")`;

    if (bg.style.backgroundImage !== image) {
      bg.style.backgroundImage = image;
      console.log("[Spotify Glow] Artwork updated:", art);
    }

    player.style.setProperty("position", "relative", "important");
    player.style.setProperty("isolation", "isolate", "important");
    player.style.setProperty("overflow", "hidden", "important");

    // Keep the player's existing content above the blur.
    for (const child of player.children) {
      if (child === bg) continue;

      if (child.dataset.spotifyGlowLayer === "1") continue;

      child.style.setProperty("position", "relative", "important");
      child.style.setProperty("z-index", "1", "important");
      child.dataset.spotifyGlowLayer = "1";
    }

    player.style.setProperty("background", "transparent", "important");
  }

  function scan() {
    document.querySelectorAll(PLAYER).forEach(apply);
  }

  let queued = false;

  function scheduleScan() {
    if (queued) return;
    queued = true;

    requestAnimationFrame(() => {
      queued = false;
      scan();
    });
  }

  const observer = new MutationObserver(scheduleScan);

  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["src", "srcset", "style"]
  });

  scan();

  console.log("[Spotify Glow] Running with now-playing-bar detection");
})();
