import httpRequest from "../utils/httpRequest.js";

const DEFAULT_IMG = "placeholder.svg?height=48&width=48"; // fall
// ack image

function renderPlaylistFollowed(data) {
    const followedContainer = document.querySelector(
        ".library-content-followed"
    );

    followedContainer.innerHTML = data
        .map((item) => {
            const imgSrc = item.image_url || DEFAULT_IMG;
            return `<div class="library-item" data-type="playlist" data-playlist-id="${item.id}">
                        <img src="${imgSrc}" alt="${item.name}" class="item-image" />
                        <div class="item-info">
                            <div class="item-title">${item.name}</div>
                            <div class="item-subtitle">Danh sách phát • ${item.total_tracks} bài hát</div>
                        </div>
                    </div>`;
        })
        .join("");
}

export async function showPlaylistFollowed() {
    try {
        const data = await httpRequest.get("/me/playlists?limit=20&offset=0");

        renderPlaylistFollowed(data.playlists);
    } catch (error) {
        console.error("Không tải được Playlists đã theo dõi");
    }
}

function renderLikedPlaylist(data) {
    const likedContainer = document.querySelector(".library-content-liked");

    // Sort để Liked Songs luôn đứng đầu
    const sortedData = [...data].sort((a, b) => {
        if (a.name === "Liked Songs") return -1;
        if (b.name === "Liked Songs") return 1;
        return 0;
    });

    likedContainer.innerHTML = sortedData
        .map((item) => {
            return `<div class="library-item" data-type="playlist" data-playlist-id="${
                item.id
            }">
                        ${
                            item.name === "Liked Songs"
                                ? `<div class="item-icon liked-songs"><i class="fas fa-heart"></i></div>`
                                : `<img src="${
                                      item.image_url || DEFAULT_IMG
                                  }" alt="${item.name}" class="item-image" />`
                        }
                        <div class="item-info">
                            <div class="item-title">${item.name}</div>
                            <div class="item-subtitle">
                                ${
                                    item.name === "Liked Songs"
                                        ? '<i class="fas fa-thumbtack"></i>'
                                        : ""
                                }
                                Danh sách phát • ${item.total_tracks} bài hát
                            </div>
                        </div>
                    </div>`;
        })
        .join("");
}

export async function showMyPlaylist(sortType = currentSortType) {
    try {
        const data = await httpRequest.get("/me/playlists");
        let playlists = [...data.playlists];

        // Sort
        if (sortType === "alphabetical") {
            playlists.sort((a, b) => {
                if (a.name === "Liked Songs") return -1;
                if (b.name === "Liked Songs") return 1;
                return a.name.localeCompare(b.name, "vi", {
                    sensitivity: "base",
                });
            });
        } else {
            playlists.sort((a, b) => {
                if (a.name === "Liked Songs") return -1;
                if (b.name === "Liked Songs") return 1;
                return 0;
            });
        }

        renderLikedPlaylist(playlists);
    } catch (error) {
        console.error("Không thể tải playlist", error);
    }
}

let currentSortType = "recent";

export async function sortAndRenderPlaylists(sortType) {
    try {
        const data = await httpRequest.get("/me/playlists");
        let playlists = [...data.playlists];

        // Tách Liked Songs ra
        const likedSongs = playlists.filter((p) => p.name === "Liked Songs");
        let otherPlaylists = playlists.filter((p) => p.name !== "Liked Songs");

        if (sortType === "alphabetical") {
            // Sắp xếp phần còn lại theo A-Z
            otherPlaylists.sort((a, b) =>
                a.name.localeCompare(b.name, "vi", { sensitivity: "base" })
            );
        } else {
            // Gần đây - giữ nguyên thứ tự mặc định
            // không cần làm gì, chỉ giữ otherPlaylists nguyên
        }

        // Ghép Liked Songs lên đầu
        const sortedPlaylists = [...likedSongs, ...otherPlaylists];

        // Render
        renderLikedPlaylist(sortedPlaylists);
    } catch (error) {
        console.error("Không thể sắp xếp playlist:", error);
    }
}

export async function createPlaylists() {
    try {
        const response = await httpRequest.post("/playlists", {
            name: "My Playlist",
            description: "Playlist description",
            is_public: true,
            image_url:
                "https://cdn.vox-cdn.com/thumbor/TtDUOcStwxcfVhfSms3Lj-5HlUY=/0x106:2040x1254/1600x900/cdn.vox-cdn.com/uploads/chorus_image/image/73520026/STK088_SPOTIFY_CVIRGINIA_C.0.jpg",
        });
        return response;
    } catch (error) {
        throw error;
    }
}

export function initPlaylists() {
    const sectionPlaylist = document.querySelector(".create-playlist");
    const sectionHit = document.querySelector(".hits-section");
    const sectionArtists = document.querySelector(".artists-section");

    const createBtn = document.querySelector(".create-btn");
    const playlistImg = document.getElementById("playlistImage");
    const uploadForm = document.getElementById("uploadForm");
    const cancelBtn = document.querySelector(".playlist-cancel");
    const uploadCover = document.getElementById("uploadCover");

    // === Gắn listener create playlist 1 lần duy nhất ===
    if (!createBtn.dataset.listener) {
        createBtn.addEventListener("click", async () => {
            try {
                const data = await createPlaylists(); // tạo playlist mới

                // 1. Refresh sidebar
                await Promise.all([showMyPlaylist(), showPlaylistFollowed()]);

                // 2. Ẩn các section không liên quan
                sectionArtists.style.display = "none";
                sectionHit.style.display = "none";

                // 3. Hiển thị section playlist mới
                sectionPlaylist.style.display = "flex";

                // 4. Hiển thị chi tiết playlist vừa tạo
                await showPlaylistById(data.playlist.id);
            } catch (err) {
                console.error(err);
            }
        });
        createBtn.dataset.listener = "true"; // đánh dấu đã gắn listener
    }
}

export function initEditPlaylistUI() {
    const playlistContainer = document.querySelector(".library-content-liked"); // hoặc cả followed nếu muốn
    const editSection = document.querySelector(".create-playlist");
    const uploadForm = document.getElementById("uploadForm");

    const playlistImg = editSection.querySelector("#playlistImage");
    const playlistTitle = editSection.querySelector(".playlist-title");

    const modalImg = uploadForm.querySelector(".playlist-img-modal");
    const modalInputTitle = uploadForm.querySelector("input[type='text']");
    const modalTextarea = uploadForm.querySelector(".playlist-bio");
    const cancelBtn = uploadForm.querySelector(".playlist-cancel");
    const saveBtn = uploadForm.querySelector(".playlist-save");
    const fileInput = uploadForm.querySelector("input[type='file']");

    // Click playlist để chỉnh sửa
    playlistContainer.addEventListener("click", async (e) => {
        const playlistEl = e.target.closest(".library-item");
        if (!playlistEl) return;

        const playlistId = playlistEl.dataset.playlistId;
        if (!playlistId) return;

        try {
            const data = await httpRequest.get(`/playlists/${playlistId}`);

            // Cập nhật UI section chính
            playlistImg.src = data.image_url || "placeholder.svg";
            playlistTitle.textContent = data.name;

            // Cập nhật UI modal
            modalImg.src = data.image_url || "placeholder.svg";
            modalInputTitle.value = data.name;
            modalTextarea.value = data.description || "";

            // Lưu playlistId vào dataset để save
            uploadForm.dataset.playlistId = playlistId;

            // Hiển thị section
            editSection.style.display = "flex";
            uploadForm.classList.add("show");
        } catch (err) {
            console.error("Không thể lấy thông tin playlist", err);
        }
    });

    // Upload cover
    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            modalImg.src = URL.createObjectURL(file);
        }
    });

    // Cancel
    cancelBtn.addEventListener("click", () => {
        uploadForm.classList.remove("show");
    });

    // Save
    saveBtn.addEventListener("click", async () => {
        const playlistId = uploadForm.dataset.playlistId;
        if (!playlistId) return;

        const updatedName = modalInputTitle.value.trim();
        const updatedDescription = modalTextarea.value.trim();
        const updatedImage = fileInput.files[0]; // nếu muốn upload ảnh mới, cần xử lý formData

        try {
            // Nếu muốn upload ảnh mới, dùng FormData
            const formData = new FormData();
            formData.append("name", updatedName);
            formData.append("description", updatedDescription);
            if (updatedImage) formData.append("image", updatedImage);

            await httpRequest.put(`/playlists/${playlistId}`, formData);

            // Refresh sidebar + update section UI
            const updatedData = await httpRequest.get(
                `/playlists/${playlistId}`
            );
            playlistImg.src = updatedData.image_url || "placeholder.svg";
            playlistTitle.textContent = updatedData.name;

            uploadForm.classList.remove("show");
        } catch (err) {
            console.error("Không thể update playlist", err);
        }
    });
}
