import httpRequest from "../utils/httpRequest.js";
import { showToast } from "../utils/toast.js";

async function fetchDetail(id, type) {
    let data;
    try {
        if (type === "artist") {
            data = await httpRequest.get(`/artists/${id}`);
            const tracksRes = await httpRequest.get(
                `/artists/${id}/tracks/popular`
            );
            data.tracks = tracksRes.tracks || [];
        }
    } catch (err) {
        console.error("Fetch detail error:", err);
        return null;
    }
    return data;
}

function renderHeroAndTracks(data, type) {
    const hero = document.querySelector(".artist-hero");
    const controls = document.querySelector(".artist-controls");
    const popular = document.querySelector(".popular-section");

    hero.style.display = "block";
    controls.style.display = "flex";
    popular.style.display = "block";

    hero.querySelector(".hero-image").src =
        data.background_image_url || "placeholder.svg";
    hero.querySelector(".artist-name").textContent = data.name;

    const listenersEl = hero.querySelector(".monthly-listeners");
    if (type === "artist") {
        listenersEl.textContent = `${(
            data.monthly_listeners || 0
        ).toLocaleString()} monthly listeners`;
    } else if (type === "playlist") {
        listenersEl.textContent = `${data.total_tracks || 0} tracks • ${(
            data.followers_count || 0
        ).toLocaleString()} followers`;
    }

    renderTracks(data, type);
}

function setupToggleButton(data, type, id) {
    const toggleBtn = document.querySelector(".toggle-btn");
    toggleBtn.replaceWith(toggleBtn.cloneNode(true));
    const btn = document.querySelector(".toggle-btn");

    if (type === "artist") {
        btn.textContent = data.is_following ? "Following" : "Follow";
        btn.addEventListener("click", async () => {
            btn.disabled = true;
            if (data.is_following) {
                await httpRequest.delete(`/artists/${id}/follow`);
                btn.textContent = "Follow";
                showToast("Removed from your library");
            } else {
                await httpRequest.post(`/artists/${id}/follow`);
                btn.textContent = "Following";
                showToast("Added to your library");
            }
            data.is_following = !data.is_following;
            btn.disabled = false;
        });
    } else if (type === "playlist") {
        btn.textContent = data.is_liked
            ? "Remove from your library"
            : "Add to your library";
        btn.addEventListener("click", async () => {
            btn.disabled = true;
            if (data.is_liked) {
                await httpRequest.delete(`/tracks/${id}/like`);
                btn.textContent = "Add to your library";
                showToast("Removed from your library");
            } else {
                await httpRequest.post(`/tracks/${id}/like`);
                btn.textContent = "Remove from your library";
                showToast("Added to your library");
            }
            data.is_liked = !data.is_liked;
            btn.disabled = false;
        });
    }
}

export async function handleDetailClick(card) {
    const id = card.dataset.id;
    const type = card.dataset.type;
    if (!id || !type) return;

    // Ẩn homepage
    if (type === "artist") {
        document.querySelector(".hits-section").style.display = "none";
        document.querySelector(".artists-section").style.display = "none";

        const data = await fetchDetail(id, type);
        if (!data) return;

        renderHeroAndTracks(data, type);
        setupToggleButton(data, type, id);
    }
    return;
}

export function initBackToHome() {
    const hitSection = document.querySelector(".hits-section");
    const artistsSection = document.querySelector(".artists-section");
    const artistHero = document.querySelector(".artist-hero");
    const artistControl = document.querySelector(".artist-controls");
    const popularSection = document.querySelector(".popular-section");
    const playlistSection = document.querySelector(".create-playlist");

    const backButtons = document.querySelectorAll(".back-btn");
    backButtons.forEach((btn) =>
        btn.addEventListener("click", () => {
            artistHero.style.display = "none";
            artistControl.style.display = "none";
            popularSection.style.display = "none";
            playlistSection.style.display = "none";

            hitSection.style.display = "block";
            artistsSection.style.display = "grid";
        })
    );
}

function renderTracks(data) {
    const popularSection = document.querySelector(".popular-section");
    const tracks = Array.isArray(data.tracks) ? data.tracks : [];

    if (!tracks.length) {
        popularSection.innerHTML = "<p>No tracks available.</p>";
        return;
    }

    popularSection.innerHTML = `
        <div class="track-list">
            ${tracks
                .map((raw, index) => {
                    const track = raw.track || raw;
                    const id = track.id || `track-${index}`;
                    const title = track.title || track.name || "Untitled";
                    const image =
                        track.image_url ||
                        track.album?.image_url ||
                        "placeholder.svg";
                    const duration = track.duration || track.duration_ms || 0;
                    const plays = track.play_count || track.popularity || 0;

                    return `
                    <div class="track-item" data-id="${id}" data-type="track">
                        <div class="track-number">${index + 1}</div>
                        <div class="track-image">
                            <img src="${image}" alt="${title}" />
                        </div>
                        <div class="track-info">
                            <div class="track-name">${title}</div>
                        </div>
                        <div class="track-plays">${plays.toLocaleString()}</div>
                        <div class="track-duration">${formatDuration(
                            duration
                        )}</div>
                        <button class="track-menu-btn">
                            <i class="fas fa-ellipsis-h"></i>
                        </button>
                    </div>
                `;
                })
                .join("")}
        </div>
    `;

    // click SPA
    popularSection.querySelectorAll(".track-item").forEach((item) => {
        item.addEventListener("click", () => handleDetailClick(item));
    });
}

function formatDuration(duration) {
    const sec = Number(duration);
    if (isNaN(sec) || sec <= 0) return "--:--";
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}
