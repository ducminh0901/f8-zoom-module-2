import { handleDetailClick } from "./detail.js";

export async function renderTracks(tracks) {
    const containerTracks = document.querySelector(".hits-grid");
    containerTracks.innerHTML = "";

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

        // Gắn event vào nút play
        const playBtn = cardTracks.querySelector(".hit-play-btn");
        playBtn.addEventListener("click", () => {
            console.log(`Playing Tracks: ${track.name}`);
        });

        cardTracks.addEventListener("click", () =>
            handleDetailClick(cardTracks)
        );

        // Thêm card vào container
        containerTracks.appendChild(cardTracks);
    });
}
