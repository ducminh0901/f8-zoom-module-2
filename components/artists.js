import { handleDetailClick } from "./detail.js";

export async function renderArtists(artists) {
    const containerArtist = document.querySelector(".artists-grid");
    containerArtist.innerHTML = "";

    artists.forEach((artist) => {
        const cardArtist = document.createElement("div");
        cardArtist.className = "artist-card";
        cardArtist.dataset.id = artist.id;
        cardArtist.dataset.type = "artist";

        cardArtist.innerHTML = `
       <div class="artist-card-cover">
                <img
                    src="${
                        artist.image_url ||
                        "placeholder.svg?height=160&width=160"
                    }"
                    alt="${artist.name}"
                />
                <button class="artist-play-btn">
                    <i class="fas fa-play"></i>
                </button>
            </div>
            <div class="artist-card-info">
                <h3 class="artist-card-name">${artist.name}</h3>
                <p class="artist-card-type">Artist</p>
            </div>
        `;

        const playBtn = cardArtist.querySelector(".artist-play-btn");
        playBtn.addEventListener("click", () => {
            console.log(`Playing playlist: ${artist.name}`);
        });

        cardArtist.addEventListener("click", () =>
            handleDetailClick(cardArtist)
        );
        containerArtist.appendChild(cardArtist);
    });
}
