import httpRequest from "../utils/httpRequest.js";

const DEFAULT_IMG = "/placeholder.svg";

function getPlaylistImage(imgUrl) {
    return imgUrl || DEFAULT_IMG;
}

// ================== Render ==================
function renderLikedPlaylist(data) {
    const likedContainer = document.querySelector(".library-content-liked");
    const sortedData = [...data].sort((a, b) => {
        if (a.name === "Liked Songs") return -1;
        if (b.name === "Liked Songs") return 1;
        return 0;
    });

    likedContainer.innerHTML = sortedData
        .map(
            (item) => `
            <div class="library-item" data-type="playlist" data-playlist-id="${
                item.id
            }">
                ${
                    item.name === "Liked Songs"
                        ? `<div class="item-icon liked-songs"><i class="fas fa-heart"></i></div>`
                        : `<img src="${getPlaylistImage(
                              item.image_url
                          )}" alt="${item.name}" class="item-image" />`
                }
                <div class="item-info">
                    <div class="item-title">${item.name}</div>
                    <div class="item-subtitle">Danh sách phát • ${
                        item.total_tracks
                    } bài hát</div>
                </div>
            </div>
        `
        )
        .join("");
}

// ================== API ==================
export async function showMyPlaylist() {
    try {
        const data = await httpRequest.get("/me/playlists");
        renderLikedPlaylist(data.playlists);
    } catch (err) {
        console.error("Không thể tải playlist", err);
    }
}

export async function createPlaylists() {
    try {
        const response = await httpRequest.post("/playlists", {
            name: "My Playlist",
            description: "Playlist description",
            user_username: "Duc Minh",
            is_public: true,
            image_url: DEFAULT_IMG,
        });
        return response.playlist;
    } catch (err) {
        throw err;
    }
}

// ================== Init Playlists ==================
export function initPlaylists() {
    const sectionPlaylist = document.querySelector(".create-playlist");
    const sectionHit = document.querySelector(".hits-section");
    const sectionArtists = document.querySelector(".artists-section");
    const playlistTitle = sectionPlaylist.querySelector(".playlist-title");
    const playlistImg = sectionPlaylist.querySelector("#playlistImage");
    const uploadForm = document.getElementById("uploadForm");
    const createBtn = document.querySelector(".create-btn");

    if (!createBtn.dataset.listener) {
        createBtn.addEventListener("click", async () => {
            try {
                const playlist = await createPlaylists();
                playlistTitle.textContent = playlist.name;
                playlistImg.src = getPlaylistImage(playlist.image_url);
                uploadForm.dataset.playlistId = playlist.id;

                await showMyPlaylist(); // refresh sidebar
                sectionArtists.style.display = "none";
                sectionHit.style.display = "none";
                sectionPlaylist.style.display = "flex";
            } catch (err) {
                console.error(err);
            }
        });
        createBtn.dataset.listener = "true";
    }
}

// ================== Edit Playlist UI ==================
export function initEditPlaylistUI() {
    const sectionHit = document.querySelector(".hits-section");
    const sectionArtists = document.querySelector(".artists-section");
    const playlistContainer = document.querySelector(".library-content-liked");
    const editSection = document.querySelector(".create-playlist");
    const uploadForm = document.getElementById("uploadForm");

    const playlistImg = editSection.querySelector("#playlistImage");
    const playlistTitle = editSection.querySelector(".playlist-title");
    const playlistOwner = editSection.querySelector(".playlist-owner");

    const modalImg = uploadForm.querySelector(".playlist-img-modal");
    const modalInputTitle = uploadForm.querySelector("input[type='text']");
    const modalTextarea = uploadForm.querySelector(".playlist-bio");
    const fileInput = uploadForm.querySelector("input[type='file']");
    const cancelBtn = uploadForm.querySelector(".playlist-cancel");
    const saveBtn = uploadForm.querySelector(".playlist-save");

    // Click playlist để chỉnh sửa
    playlistContainer.addEventListener("click", async (e) => {
        const playlistEl = e.target.closest(".library-item");
        if (!playlistEl) return;
        const playlistId = playlistEl.dataset.playlistId;
        if (!playlistId) return;

        try {
            const data = await httpRequest.get(`/playlists/${playlistId}`);

            playlistImg.src = getPlaylistImage(data.image_url);
            playlistTitle.textContent = data.name;
            playlistOwner.textContent = data.user_username || "Đức Minh";

            modalImg.src = getPlaylistImage(data.image_url);
            modalInputTitle.value = data.name;
            modalTextarea.value = data.description || "";
            uploadForm.dataset.playlistId = playlistId;

            sectionArtists.style.display = "none";
            sectionHit.style.display = "none";
            editSection.style.display = "flex";
            // uploadForm.classList.add("show");
        } catch (err) {
            console.error("Không thể lấy thông tin playlist", err);
        }
    });

    document.addEventListener("click", (e) => {
        if (e.target.closest(".upload-label")) {
            uploadForm.classList.add("show");
        }
    });

    // Upload cover preview
    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) modalImg.src = URL.createObjectURL(file);
    });

    // Cancel
    cancelBtn.addEventListener("click", () => {
        uploadForm.classList.remove("show");
        fileInput.value = "";
    });

    // Save changes
    saveBtn.addEventListener("click", async () => {
        const playlistId = uploadForm.dataset.playlistId;
        if (!playlistId) return;

        const updatedName = modalInputTitle.value.trim();
        const updatedDescription = modalTextarea.value.trim();
        const updatedImage = fileInput.files[0];

        try {
            let payload,
                headers = {};
            if (updatedImage) {
                payload = new FormData();
                payload.append("name", updatedName);
                payload.append("description", updatedDescription);
                payload.append("image", updatedImage);
            } else {
                payload = {
                    name: updatedName,
                    description: updatedDescription,
                };
                headers["Content-Type"] = "application/json";
            }

            await httpRequest.put(`/playlists/${playlistId}`, payload, {
                headers,
            });

            const updatedData = await httpRequest.get(
                `/playlists/${playlistId}`
            );
            playlistImg.src = getPlaylistImage(updatedData.image_url);
            playlistTitle.textContent = updatedData.name;

            await showMyPlaylist(); // refresh sidebar

            // Reset modal
            modalInputTitle.value = "";
            modalTextarea.value = "";
            fileInput.value = "";
            modalImg.src = DEFAULT_IMG;
            uploadForm.classList.remove("show");
        } catch (err) {
            console.error("Không thể update playlist", err);
        }
    });
}
