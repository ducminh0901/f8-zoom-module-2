import httpRequest from "../utils/httpRequest.js";
import { showToast } from "../utils/toast.js";

export async function handleDetailClick(card) {
    const id = card.dataset.id;
    const type = card.dataset.type;

    if (!id || !type) return;

    let data;
    try {
        if (type === "playlist") {
            data = await httpRequest.get(`/tracks/${id}`);
        } else if (type === "artist") {
            data = await httpRequest.get(`/artists/${id}`);
        } else if (type === "album") {
            data = await httpRequest.get(`/albums/${id}`);
        }
    } catch (err) {
        console.error("Fetch detail error:", err);
        return;
    }

    // Ẩn homepage
    document.querySelector(".hits-section").style.display = "none";
    document.querySelector(".artists-section").style.display = "none";

    // Hiển thị hero
    const artistHero = document.querySelector(".artist-hero");
    const artistControl = document.querySelector(".artist-controls");
    const popularSection = document.querySelector(".popular-section");

    artistHero.style.display = "block";
    artistControl.style.display = "flex";
    popularSection.style.display = "block";

    // Cập nhật hero info
    artistHero.querySelector(".hero-image").src =
        data.image_url || "placeholder.svg";
    artistHero.querySelector(".artist-name").textContent = data.name;

    const listenersEl = artistHero.querySelector(".monthly-listeners");
    if (type === "artist") {
        const monthly = data.monthly_listeners || 0;
        listenersEl.textContent = `${monthly.toLocaleString()} monthly listeners`;
    } else if (type === "playlist") {
        const tracks = data.total_tracks || 0;
        const followers = data.followers_count || 0;
        listenersEl.textContent = `${tracks} tracks • ${followers.toLocaleString()} followers`;
    }

    const toggleBtn = document.querySelector(".toggle-btn");

    toggleBtn.replaceWith(toggleBtn.cloneNode(true));
    const newToggleBtn = document.querySelector(".toggle-btn");

    if (type === "artist") {
        newToggleBtn.textContent = data.is_following ? "Following" : "Follow";

        newToggleBtn.addEventListener("click", async () => {
            newToggleBtn.disabled = true;
            if (data.is_following) {
                await httpRequest.delete(`/artists/${id}/follow`);
                newToggleBtn.textContent = "Follow";
                showToast("Removed from your library");
            } else {
                await httpRequest.post(`/artists/${id}/follow`);
                newToggleBtn.textContent = "Following";
                showToast("Added to your library");
            }
            data.is_following = !data.is_following;
            newToggleBtn.disabled = false;
        });
    } else if (type === "playlist") {
        newToggleBtn.textContent = data.is_liked
            ? "Remove from your library"
            : "Add to your library";
        newToggleBtn.addEventListener("click", async () => {
            newToggleBtn.disabled = true;
            if (data.is_liked) {
                await httpRequest.delete(`/tracks/${id}/like`);
                newToggleBtn.textContent = "Add to your library";
                showToast("Removed from your library");
            } else {
                await httpRequest.post(`/tracks/${id}/like`);
                newToggleBtn.textContent = "Remove from your library";
                showToast("Added to your library");
            }
            data.is_liked = !data.is_liked;
            newToggleBtn.disabled = false;
        });
    }
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
