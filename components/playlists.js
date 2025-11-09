import httpRequest from "../utils/httpRequest.js";
import { initSidebar } from "../utils/sidebar.js";

const DEFAULT_IMG =
    "https://community.spotify.com/t5/image/serverpage/image-id/196380iDD24539B5FCDEAF9/image-size/medium?v=v2&px=400";

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

        initSidebar();
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
    const artistHero = document.querySelector(".artist-hero");
    const artistControl = document.querySelector(".artist-controls");
    const artistPopular = document.querySelector(".popular-section");
    const uploadForm = document.getElementById("uploadForm");

    const playlistTitle = editSection.querySelector(".playlist-title");
    const playlistOwner = editSection.querySelector(".playlist-owner");

    const modalImg = uploadForm.querySelector(".playlist-img-modal");
    const modalInputTitle = uploadForm.querySelector("input[type='text']");
    const modalTextarea = uploadForm.querySelector(".playlist-bio");
    const fileInput = document.getElementById("uploadCover");
    const playlistImg = document.getElementById("playlistImage");

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
            artistHero.style.display = "none";
            artistControl.style.display = "none";
            artistPopular.style.display = "none";

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
        if (!file) return;
        playlistImg.src = URL.createObjectURL(file);
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
            let newImage = null;

            // ================== B1: Upload ảnh nếu có ==================
            if (updatedImage) {
                const formData = new FormData();
                formData.append("cover", updatedImage);

                console.log("📤 Uploading new cover:", updatedImage.name);
                const uploadRes = await httpRequest.post(
                    `/upload/playlist/${playlistId}/cover`,
                    formData
                );
                console.log("✅ uploadRes:", uploadRes);

                // === B1: Lấy đường dẫn ảnh mới ===
                // Nếu backend chỉ trả path, ta tự nối domain
                let newImage =
                    uploadRes?.image_url ||
                    uploadRes?.url ||
                    uploadRes?.path ||
                    null;

                if (newImage && newImage.startsWith("/")) {
                    newImage = `https://spotify.f8team.dev${newImage}`;
                }

                // Nếu vẫn chưa có, gọi lại GET để lấy playlist mới
                if (!newImage) {
                    const refreshed = await httpRequest.get(
                        `/playlists/${playlistId}`
                    );
                    newImage = refreshed.image_url;
                }

                // === B2: Gửi PUT để gắn ảnh mới vào DB ===
                if (newImage) {
                    const payload = {
                        name: updatedName,
                        description: updatedDescription,
                        image_url: newImage,
                    };
                    await httpRequest.put(`/playlists/${playlistId}`, payload, {
                        headers: { "Content-Type": "application/json" },
                    });

                    modalImg.src = newImage;
                    playlistImg.src = newImage;
                    console.log("✅ Ảnh mới đã được cập nhật vào playlist!");
                } else {
                    console.warn("⚠️ Không tìm được URL ảnh mới từ server!");
                }
            }

            // ================== B2: PUT update playlist ==================
            const payload = {
                name: updatedName,
                description: updatedDescription,
            };
            if (newImage) payload.image_url = newImage;

            const updateRes = await httpRequest.put(
                `/playlists/${playlistId}`,
                payload,
                {
                    headers: { "Content-Type": "application/json" },
                }
            );

            const updatedPlaylist = updateRes.playlist;
            console.log("🎨 Updated playlist:", updatedPlaylist);

            // ================== B3: Update UI ==================
            if (updatedPlaylist.image_url) {
                modalImg.src = updatedPlaylist.image_url;
                playlistImg.src = updatedPlaylist.image_url;
            } else if (newImage) {
                modalImg.src = newImage;
                playlistImg.src = newImage;
            }

            playlistTitle.textContent = updatedPlaylist.name;
            await showMyPlaylist();

            // ================== B4: Reset modal ==================
            modalInputTitle.value = "";
            modalTextarea.value = "";
            fileInput.value = "";
            uploadForm.classList.remove("show");

            console.log("✅ Playlist cập nhật thành công!");
        } catch (err) {
            console.error("❌ Không thể update playlist:", err);
        }
    });
}
