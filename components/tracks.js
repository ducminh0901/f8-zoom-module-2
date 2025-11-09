import httpRequest from "../utils/httpRequest.js";
import { initTooltip } from "../utils/tooltip.js";

export async function renderTracks(tracks) {
    const containerTracks = document.querySelector(".hits-grid");
    containerTracks.innerHTML = "";

    currentPlaylist = tracks;

    tracks.forEach((track) => {
        const cardTracks = document.createElement("div");
        cardTracks.className = "hit-card";
        cardTracks.dataset.id = track.id;
        cardTracks.dataset.type = "playlist";

        cardTracks.innerHTML = `
      <div class="hit-card-cover">
        <img src="${
            track.image_url || "placeholder.svg?height=160&width=160"
        }" alt="${track.name}" />
        <button class="hit-play-btn"><i class="fas fa-play"></i></button>
      </div>
      <div class="hit-card-info">
        <h3 class="hit-card-title">${track.title}</h3>
        <p class="hit-card-artist">${track.artist_name || "No description"}</p>
      </div>
    `;
        // Thêm card vào container
        containerTracks.appendChild(cardTracks);
    });
}

//PLAY MUSIC

const NEXT = 1;
const PREV = -1;

const MIN_TIME_TO_RESTART = 2;

let isRepeating = localStorage.getItem("isRepeating") === "true";
let isShuffling = localStorage.getItem("isShuffling") === "true";

const audio = document.getElementById("audio");

const nextBtn = document.querySelector(".next-btn");
const prevBtn = document.querySelector(".prev-btn");
const playPauseBtn = document.querySelector(".play-btn");
const repeatBtn = document.querySelector(".repeat-btn");
const shuffleBtn = document.querySelector(".shuffle-btn");

const progressBar = document.querySelector(".progress-bar");
const progressFill = document.querySelector(".progress-fill");
const progressHandle = document.querySelector(".progress-handle");
const currentTimeEl = document.querySelector(".time.current-time");
const durationEl = document.querySelector(".time.duration");

let isPlaying = false;
let isSeeking = false;
let currentPlaylist = [];
let originalIndex = 0;
let currentIndex = Number(localStorage.getItem("currentIndex")) || 0;

let shufflePlaylist = [];
let shuffleHistory = [];

if (isShuffling) {
    shuffleBtn.classList.add("active");
    createShufflePlaylist();
} else {
    shuffleBtn.classList.remove("active");
}

if (isRepeating) {
    repeatBtn.classList.add("active");
} else {
    repeatBtn.classList.remove("active");
}

export function initTrackCardsListerner() {
    document.addEventListener("click", async (e) => {
        const playHitBtn = e.target.closest(".hit-play-btn");
        if (playHitBtn) {
            e.preventDefault();
            await showTrackPlaying(e);
        }

        const trackItem = e.target.closest(".track-item");
        if (trackItem) {
            e.preventDefault();
            if (trackItem.classList.contains("playing")) {
                trackItem.classList.remove("playing");
                audio.pause();
            } else {
                const allTrackItems = document.querySelectorAll(".track-item");
                allTrackItems.forEach((item) =>
                    item.classList.remove("playing")
                );
                trackItem.classList.add("playing");
                await showTrackPlaying(e);
            }
        }
    });
}

export async function initPlayer() {
    const storedSongId = localStorage.getItem("currentSongId");
    if (!storedSongId) return;

    try {
        const data = await httpRequest.get(`/tracks/${storedSongId}`);
        renderTracksPlayingById(data);
        audio.src = data.audio_url;
    } catch (error) {
        console.error("Error fetching stored track data:", error);
    }
}

export async function showTrackPlaying(e) {
    const trackItem = e.target.closest(".hit-card, .track-item");
    if (!trackItem) return;

    const trackId = trackItem.dataset.id;
    if (!trackId) return console.error("Track ID not found");

    try {
        const data = await httpRequest.get(`/tracks/${trackId}`);
        renderTracksPlayingById(data);

        localStorage.setItem("currentSongId", data.id);

        if (data?.audio_url) {
            // Ngắt bài cũ trước khi load bài mới
            audio.pause();
            audio.src = data.audio_url;
            audio.load();

            // Chờ khi audio đủ dữ liệu mới phát
            audio.addEventListener(
                "canplay",
                async () => {
                    try {
                        await audio.play();
                    } catch (err) {
                        console.warn("Không thể phát nhạc:", err);
                    }
                },
                { once: true } // chỉ chạy một lần, tránh bị gọi lại khi load lại
            );
        } else {
            console.error("Track không có audio_url hợp lệ:", data);
        }
    } catch (error) {
        console.error("Error fetching track data:", error);
    }
}

function renderTracksPlayingById(data) {
    const player = document.querySelector(".player-left");
    player.innerHTML = `
    <img src="${data.image_url}" alt="Current track" class="player-image" />
    <div class="player-info">
      <div class="player-title">${data.title}</div>
      <div class="player-artist">${data.artist_name}</div>
    </div>
    <button class="add-btn" data-tooltip="Add">
      <i class="fa-solid fa-plus"></i>
    </button>`;

    const addBtn = player.querySelector(".add-btn");
    if (addBtn) {
        initTooltip(addBtn);
    }
}

function updatePlayPauseButton() {
    if (isPlaying) {
        audio.pause();
    } else {
        audio.play();
    }
}

export function initPlayerControls() {
    playPauseBtn.addEventListener("click", updatePlayPauseButton);

    audio.addEventListener("play", () => {
        isPlaying = true;
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        playPauseBtn.setAttribute("data-tooltip", "Pause");
    });

    audio.addEventListener("pause", () => {
        isPlaying = false;
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        playPauseBtn.setAttribute("data-tooltip", "Play");
    });

    audio.addEventListener("ended", async () => {
        if (isRepeating) {
            audio.currentTime = 0;
            await audio.play();
            return;
        }

        handlePrevOrNext(NEXT);
    });
}

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60)
        .toString()
        .padStart(2, "0");
    return `${min}:${sec}`;
}

// Update progress fill + handle + time
function updateProgressUI(current, duration) {
    const percent = (current / duration) * 100;
    // Thêm offset để handle khít fill
    const handleOffsetPercent =
        (progressHandle.offsetWidth / progressBar.offsetWidth) * 50; // nửa handle
    progressFill.style.width =
        Math.min(percent + handleOffsetPercent, 100) + "%";
    progressHandle.style.left = percent + "%";
    currentTimeEl.textContent = formatTime(current);
    progressHandle.setAttribute("data-tooltip", formatTime(current));
}

// Load duration
audio.addEventListener("loadedmetadata", () => {
    durationEl.textContent = formatTime(audio.duration);
    updateProgressUI(audio.currentTime, audio.duration);
});

// Update progress khi audio play
audio.addEventListener("timeupdate", () => {
    if (!isSeeking) updateProgressUI(audio.currentTime, audio.duration);
});

// Click trên thanh progress
progressBar.addEventListener("click", (e) => {
    if (!audio.duration) return;
    const rect = progressBar.getBoundingClientRect();
    let clickX = e.clientX - rect.left;
    clickX = Math.max(0, Math.min(clickX, rect.width));
    const percent = clickX / rect.width;
    audio.currentTime = percent * audio.duration;
    updateProgressUI(audio.currentTime, audio.duration);
});

// Drag handle
progressHandle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    isSeeking = true;
    const rect = progressBar.getBoundingClientRect();

    const onMouseMove = (eMove) => {
        let x = eMove.clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const percent = x / rect.width;
        progressFill.style.width = percent * 100 + "%";
        progressHandle.style.left = percent * 100 + "%";
        progressHandle.setAttribute(
            "data-tooltip",
            formatTime(percent * audio.duration)
        );
    };

    const onMouseUp = (eUp) => {
        let x = eUp.clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const percent = x / rect.width;
        audio.currentTime = percent * audio.duration;
        isSeeking = false;

        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
});

async function handlePrevOrNext(direction) {
    let nextTrack;

    if (isShuffling) {
        // Shuffle mode
        nextTrack = direction === NEXT ? getNextShuffle() : getPrevShuffle();
    } else {
        // Bình thường
        if (direction === NEXT) {
            currentIndex = (currentIndex + 1) % currentPlaylist.length;
        } else {
            currentIndex =
                (currentIndex - 1 + currentPlaylist.length) %
                currentPlaylist.length;
        }
        nextTrack = currentPlaylist[currentIndex];
    }

    if (!nextTrack) return;

    localStorage.setItem("currentSongId", nextTrack.id || nextTrack.track_id);

    // Phát bài

    try {
        audio.src = nextTrack.audio_url;
        audio.load();
        await audio.play();
    } catch (error) {
        console.warn("Không thể phát nhạc:", error);
    }

    // Cập nhật UI
    renderTracksPlayingById(nextTrack);
}

// Gắn nút
nextBtn.addEventListener("click", () => handlePrevOrNext(NEXT));
prevBtn.addEventListener("click", () => {
    if (audio.currentTime > MIN_TIME_TO_RESTART) {
        audio.currentTime = 0;
    } else {
        handlePrevOrNext(PREV);
    }
});

shuffleBtn.addEventListener("click", () => {
    isShuffling = !isShuffling;
    shuffleBtn.classList.toggle("active", isShuffling);
    localStorage.setItem("isShuffling", isShuffling);

    if (isShuffling) {
        originalIndex = currentIndex;
        createShufflePlaylist();
        console.log("Shuffle ON");
    } else {
        const currentSongId = localStorage.getItem("currentSongId");
        const realIndex = currentPlaylist.findIndex(
            (track) =>
                track.id === currentSongId || track.track_id === currentSongId
        );

        if (realIndex !== -1) currentIndex = realIndex;

        shufflePlaylist = [];
        shuffleHistory = [];
        console.log("Shuffle OFF");
    }
});

repeatBtn.addEventListener("click", () => {
    isRepeating = !isRepeating;
    repeatBtn.classList.toggle("active", isRepeating);
    localStorage.setItem("isRepeating", isRepeating);
});

// Khi click trực tiếp bài
document.addEventListener("click", (e) => {
    const trackItem = e.target.closest(".hit-card, .track-item");
    if (!trackItem) return;

    const trackId = trackItem.dataset.id;
    const index = currentPlaylist.findIndex((t) => t.id === trackId);
    if (index !== -1) {
        currentIndex = index;
        const track = currentPlaylist[currentIndex];

        if (isShuffling) createShufflePlaylist();

        renderTracksPlayingById(track);
        audio.pause();
        audio.src = track.audio_url;
        audio.load();
        audio.addEventListener(
            "canplay",
            async () => {
                try {
                    await audio.play();
                } catch (err) {
                    console.warn("Không thể phát nhạc:", err);
                }
            },
            { once: true }
        );
        localStorage.setItem("currentSongId", track.id);
    }
});

function createShufflePlaylist() {
    if (!currentPlaylist || !currentPlaylist.length) return;

    const currentTrack = currentPlaylist[currentIndex];
    const currentId = currentTrack.id || currentTrack.track_id;

    shufflePlaylist = currentPlaylist.filter(
        (t) => (t.id || t.track_id) !== currentId
    );

    for (let i = shufflePlaylist.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shufflePlaylist[i], shufflePlaylist[j]] = [
            shufflePlaylist[j],
            shufflePlaylist[i],
        ];
    }

    shufflePlaylist.unshift(currentTrack);

    shuffleHistory = [currentTrack];
    currentIndex = 0;
}

function getNextShuffle() {
    if (!shufflePlaylist.length) createShufflePlaylist();

    if (currentIndex < shufflePlaylist.length - 1) {
        currentIndex++;
    } else {
        // Hết bài → shuffle lại
        createShufflePlaylist();
        currentIndex = 0;
    }

    const nextTrack = shufflePlaylist[currentIndex];
    shuffleHistory.push(nextTrack);
    return nextTrack;
}

function getPrevShuffle() {
    if (!shufflePlaylist.length) createShufflePlaylist();

    if (currentIndex > 0) {
        currentIndex--;
    } else {
        // Quay lại cuối danh sách
        currentIndex = shufflePlaylist.length - 1;
    }

    const prevTrack = shufflePlaylist[currentIndex];
    shuffleHistory.push(prevTrack);
    return prevTrack;
}

export function handleVolumeAudio() {
    const volumeContainer = document.querySelector(".volume-container");
    const volumeBtn = volumeContainer.querySelector(".control-btn i");
    const volumeBar = volumeContainer.querySelector(".volume-bar");
    const volumeFill = volumeContainer.querySelector(".volume-fill");
    const volumeHandle = volumeContainer.querySelector(".volume-handle");

    const savedVolume = Number(localStorage.getItem("volume")) || 0.7;
    audio.volume = savedVolume;
    updateVolumeUI(audio.volume);

    function updateVolumeUI(volume) {
        const percent = volume * 100;
        volumeFill.style.width = `${percent}%`;
        volumeHandle.style.left = `calc(${percent}% - 6px)`;

        if (volume === 0) {
            volumeBtn.className = "fas fa-volume-mute";
        } else if (volume < 0.5) {
            volumeBtn.className = "fas fa-volume-down";
        } else {
            volumeBtn.className = "fas fa-volume-up";
        }
    }

    // Toggle mute / unmute
    let lastVolume = savedVolume;
    volumeContainer
        .querySelector(".control-btn")
        .addEventListener("click", () => {
            if (audio.volume > 0) {
                lastVolume = audio.volume;
                audio.volume = 0;
            } else {
                audio.volume = lastVolume || 0.7;
            }

            localStorage.setItem("volume", audio.volume);
            updateVolumeUI(audio.volume);
        });

    // Click trên thanh để thay đổi volume
    volumeBar.addEventListener("click", (e) => {
        const rect = volumeBar.getBoundingClientRect();
        const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const percent = clickX / rect.width;
        audio.volume = percent;
        localStorage.setItem("volume", audio.volume);
        updateVolumeUI(audio.volume);
    });

    // Kéo handle để điều chỉnh
    volumeHandle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const rect = volumeBar.getBoundingClientRect();

        const onMouseMove = (eMove) => {
            let x = eMove.clientX - rect.left;
            x = Math.max(0, Math.min(x, rect.width));
            const percent = x / rect.width;
            audio.volume = percent;
            localStorage.setItem("volume", audio.volume);
            updateVolumeUI(audio.volume);
        };

        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    });
}
