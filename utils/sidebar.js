let currentSortType = "recent";

import { sortAndRenderPlaylists } from "../components/playlists.js";

export function initSidebar() {
    const sortBtn = document.querySelector(".sort-btn");
    const sortDropdown = document.querySelector(".sort-dropdown");
    const sortText = document.querySelector(".sort-text");
    const sortOptions = document.querySelectorAll(".dropdown-list");
    const icons = document.querySelectorAll(".view-style-icon");
    const mainIcon = document.querySelector(".sort-view-icon");
    const items = document.querySelectorAll(".library-item");

    if (!sortBtn || !sortDropdown) return;

    // === 1. Toggle dropdown ===
    sortBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        sortDropdown.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
        if (!sortBtn.contains(e.target) && !sortDropdown.contains(e.target)) {
            sortDropdown.classList.remove("show");
        }
    });

    // === 2. Sort options ===
    sortOptions.forEach((option) => {
        option.addEventListener("click", async () => {
            const sortType = option.dataset.sort;

            // Cập nhật active
            sortOptions.forEach((opt) => opt.classList.remove("active"));
            option.classList.add("active");

            // Cập nhật text trên nút sort
            sortText.textContent =
                sortType === "recent" ? "Recent" : "Alphabetical";

            // Xoá arrow icon cũ (nếu có)
            const oldArrow = document.querySelector(".arrow-icon");
            if (oldArrow) oldArrow.remove();

            // Tạo và gắn icon mới vào option đang chọn
            const arrowIcon = document.createElement("i");
            arrowIcon.className = "fa-solid fa-arrow-down arrow-icon";
            option.appendChild(arrowIcon);

            // Đóng dropdown
            sortDropdown.classList.remove("show");

            // Lưu trạng thái + sort lại playlist
            currentSortType = sortType;
            await sortAndRenderPlaylists(sortType);
        });
    });

    // === 3. Đổi view style (grid/list) ===
    icons.forEach((icon) => {
        icon.addEventListener("click", () => {
            document
                .querySelector(".view-style-icon.active")
                ?.classList.remove("active");
            icon.classList.add("active");

            const viewStyle = icon.dataset.viewStyle;
            const iconMap = {
                "default-grid": "fa-border-all",
                "compact-grid": "fa-table-cells",
                "default-list": "fa-list",
                "compact-list": "fa-bars",
            };
            const newIconClass = iconMap[viewStyle] || "fa-list"; // fallback

            // Đổi layout cho items
            items.forEach((item) => {
                item.classList.remove(
                    "compact-list",
                    "default-list",
                    "compact-grid",
                    "default-grid"
                );
                item.classList.add(viewStyle);
            });

            // Đổi icon trong sort-btn
            if (mainIcon) {
                mainIcon.className = `fas sort-view-icon ${newIconClass}`;
            }
        });
    });

    // === 4. Active item ===
    items.forEach((item) => {
        item.addEventListener("click", () => {
            document
                .querySelector(".library-item.active")
                ?.classList.remove("active");
            item.classList.add("active");
        });
    });
}
export function searchInSidebar() {
    const searchBtn = document.querySelector(".search-library-btn");
    const searchArea = document.querySelector(".search-library");
    const sortBtn = document.querySelector(".sort-btn");

    searchBtn.addEventListener("click", () => {
        const searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.className = "search-input";
        searchInput.placeholder = "Search In Your Library";

        if (!searchArea.querySelector(".search-input")) {
            searchArea.prepend(searchInput);
            searchInput.focus();
            sortBtn.style.display = "none";
            searchBtn.style.display = "none";
        } else {
            searchArea.querySelector(".search-input").remove();
        }
    });
    document.addEventListener("click", (event) => {
        if (
            !searchArea.contains(event.target) &&
            !searchBtn.contains(event.target)
        ) {
            const searchInput = searchArea.querySelector(".search-input");
            if (searchInput) searchInput.remove();
            sortBtn.style.display = "inline-block";
            searchBtn.style.display = "flex";
        }
    });
}

// Tạo context menu

export function initContextMenu() {
    const libraryItems = document.querySelectorAll(".library-item");

    libraryItems.forEach((item) => {
        item.addEventListener("contextmenu", (e) => {
            e.preventDefault();

            document.querySelector(".context-menu")?.remove();

            const menu = document.createElement("div");
            menu.className = "context-menu";
            Object.assign(menu.style, {
                position: "absolute",
                top: `${e.pageY}px`,
                left: `${e.pageX}px`,
                background: "#222",
                color: "#fff",
                padding: "8px",
                borderRadius: "6px",
                zIndex: 1000,
                minWidth: "160px",
            });

            const type = item.dataset.type;

            function addMenuItem(iconClass, text) {
                const div = document.createElement("div");
                Object.assign(div.style, {
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 8px",
                    cursor: "pointer",
                });

                const icon = document.createElement("i");
                icon.className = iconClass;
                if (text === "Unfollow") {
                    icon.style.color = "#1db954";
                }
                div.appendChild(icon);

                const span = document.createElement("span");
                span.textContent = text;
                div.appendChild(span);

                div.addEventListener(
                    "mouseenter",
                    () => (div.style.backgroundColor = "#333")
                );
                div.addEventListener(
                    "mouseleave",
                    () => (div.style.backgroundColor = "transparent")
                );

                div.addEventListener("click", () => {
                    menu.remove();
                });

                menu.appendChild(div);
            }

            if (type === "artist") {
                addMenuItem("fa-solid fa-x", "Unfollow");
                addMenuItem("fa-solid fa-ban", "Don't play this artist");
            } else if (type === "playlist") {
                addMenuItem("fas fa-minus-circle", "Remove from profile");
                addMenuItem("fas fa-trash", "Delete");
            }

            document.body.appendChild(menu);

            const removeMenu = (e2) => {
                if (!menu.contains(e2.target)) {
                    menu.remove();
                    document.removeEventListener("click", removeMenu);
                }
            };
            document.addEventListener("click", removeMenu);
        });
    });
}

export function filterButtons() {
    const filterBtns = document.querySelectorAll(".nav-tab");
    const lists = document.querySelectorAll(".library-item");
    const xBtn = document.querySelector(".x-tab");

    filterBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            filterBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");

            xBtn.style.display = "flex";

            const type = btn.dataset.type;

            lists.forEach((list) => {
                if (type === "all" || list.dataset.type === type) {
                    list.style.display = "flex";
                } else {
                    list.style.display = "none";
                }
            });
        });
    });

    xBtn.addEventListener("click", () => {
        filterBtns.forEach((b) => b.classList.remove("active"));

        xBtn.style.display = "none";

        lists.forEach((list) => {
            list.style.display = "flex";
        });
    });
}
