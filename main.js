import httpRequest from "./utils/httpRequest.js";
import { initTooltip } from "./utils/tooltip.js";
import { initSidebar } from "./utils/sidebar.js";
import { searchInSidebar } from "./utils/sidebar.js";
import { initContextMenu } from "./utils/sidebar.js";
import { renderTracks } from "./components/tracks.js";
import { renderArtists } from "./components/artists.js";
import { filterButtons } from "./utils/sidebar.js";
import { handleDetailClick } from "./components/detail.js";
import { initBackToHome } from "./components/detail.js";
import {
    initPlaylists,
    showMyPlaylist,
    showPlaylistFollowed,
    initEditPlaylistUI,
} from "./components/playlists.js";

// Auth Modal Functionality
document.addEventListener("DOMContentLoaded", function () {
    // Get DOM elements
    const signupBtn = document.querySelector(".signup-btn");
    const loginBtn = document.querySelector(".login-btn");
    const authModal = document.getElementById("authModal");
    const modalClose = document.getElementById("modalClose");
    const signupForm = document.getElementById("signupForm");
    const loginForm = document.getElementById("loginForm");
    const showLoginBtn = document.getElementById("showLogin");
    const showSignupBtn = document.getElementById("showSignup");

    // Function to show signup form
    function showSignupForm() {
        signupForm.style.display = "block";
        loginForm.style.display = "none";
    }

    // Function to show login form
    function showLoginForm() {
        signupForm.style.display = "none";
        loginForm.style.display = "block";
    }

    // Function to open modal
    function openModal() {
        authModal.classList.add("show");
        document.body.style.overflow = "hidden"; // Prevent background scrolling
    }

    // Open modal with Sign Up form when clicking Sign Up button
    signupBtn.addEventListener("click", function () {
        showSignupForm();
        openModal();
    });

    // Open modal with Login form when clicking Login button
    loginBtn.addEventListener("click", function () {
        showLoginForm();
        openModal();
    });

    // Close modal function
    function closeModal() {
        authModal.classList.remove("show");
        document.body.style.overflow = "auto"; // Restore scrolling
    }

    // Close modal when clicking close button
    modalClose.addEventListener("click", closeModal);

    // Close modal when clicking overlay (outside modal container)
    authModal.addEventListener("click", function (e) {
        if (e.target === authModal) {
            closeModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && authModal.classList.contains("show")) {
            closeModal();
        }
    });

    // Switch to Login form
    showLoginBtn.addEventListener("click", function () {
        showLoginForm();
    });

    // Switch to Signup form
    showSignupBtn.addEventListener("click", function () {
        showSignupForm();
    });

    signupForm
        .querySelector(".auth-form-content")
        .addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = signupForm.querySelector("#signupEmail").value;
            const password = signupForm.querySelector("#signupPassword").value;
            const credentials = {
                email,
                password,
            };

            try {
                const { user, access_token } = await httpRequest.post(
                    "/auth/register",
                    credentials
                );

                localStorage.setItem("access_token", access_token);
                localStorage.setItem("currentUser", user.email);
                getCurrentUser(user);
                closeModal();
            } catch (error) {
                if (
                    error.response &&
                    error.response.error.code === "EMAIL_EXISTS"
                ) {
                    console.log(error.response.error.message);
                }
            }
        });
    loginForm
        .querySelector(".auth-form-content")
        .addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector("#loginEmail").value;
            const password = loginForm.querySelector("#loginPassword").value;
            const credentials = {
                email,
                password,
            };

            try {
                const { user, access_token } = await httpRequest.post(
                    "/auth/login",
                    credentials
                );

                localStorage.setItem("access_token", access_token);
                localStorage.setItem("currentUser", user.email);

                getCurrentUser(user);
                closeModal();
            } catch (error) {
                if (
                    error.response &&
                    error.response.error.code === "INVALID_CREDENTIALS"
                ) {
                    console.log(error.response.error.message);
                }
            }
        });
});

// User Menu Dropdown Functionality
document.addEventListener("DOMContentLoaded", function () {
    const userAvatar = document.getElementById("userAvatar");
    const userDropdown = document.getElementById("userDropdown");
    const logoutBtn = document.getElementById("logoutBtn");

    // Toggle dropdown when clicking avatar
    userAvatar.addEventListener("click", function (e) {
        e.stopPropagation();
        userDropdown.classList.toggle("show");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function (e) {
        if (
            !userAvatar.contains(e.target) &&
            !userDropdown.contains(e.target)
        ) {
            userDropdown.classList.remove("show");
        }
    });

    // Close dropdown when pressing Escape
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && userDropdown.classList.contains("show")) {
            userDropdown.classList.remove("show");
        }
    });

    // Handle logout button click
    logoutBtn.addEventListener("click", async function () {
        // Close dropdown first
        userDropdown.classList.remove("show");

        try {
            await httpRequest.post("/auth/logout");
            localStorage.removeItem("access_token");
            localStorage.removeItem("currentUser");

            getCurrentUser(null);
        } catch (error) {
            console.log("Error during logout:", error);
        }
    });
});

// Other functionality
document.addEventListener("DOMContentLoaded", async function () {
    // TODO: Implement other functionality here
    const res = await httpRequest.get("/tracks/trending");
    renderTracks(res.tracks);
});

document.addEventListener("DOMContentLoaded", async function () {
    // TODO: Implement other functionality here
    const res = await httpRequest.get("/artists/trending");
    renderArtists(res.artists);
});

document.addEventListener("DOMContentLoaded", async function () {
    try {
        const { user } = await httpRequest.get("/users/me");
        getCurrentUser(user);
    } catch (error) {
        console.log("Error fetching current user:", error);
        getCurrentUser(null);
    }
});

function getCurrentUser(user) {
    const authButtons = document.querySelector(".auth-buttons");
    const userInfo = document.querySelector(".user-info");
    const userName = document.querySelector("#user-name");

    if (user && user.email) {
        // Có user => hiển thị thông tin user
        authButtons.classList.remove("show");
        userInfo.classList.add("show");
        userName.textContent = user.email;
    } else {
        // Không có user => hiển thị nút đăng nhập, đăng ký
        authButtons.classList.add("show");
        userInfo.classList.remove("show");
        userName.textContent = "";
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const controlButtons = document.querySelectorAll(".control-btn");
    const addBtns = document.querySelectorAll(".add-btn");

    // Thêm tooltip cho các button điều khiển nếu chưa có

    controlButtons.forEach((btn) => {
        // Nếu chưa có data-tooltip thì set
        if (!btn.hasAttribute("data-tooltip")) {
            const tooltipText = btn.getAttribute("data-name") || "Tooltip";
            btn.setAttribute("data-tooltip", tooltipText);
        }

        // Đảm bảo có class tooltip
        if (!btn.classList.contains("tooltip")) {
            btn.classList.add("tooltip");
        }
    });
    addBtns.forEach((btn) => {
        // Nếu chưa có data-tooltip thì set
        if (!btn.hasAttribute("data-tooltip")) {
            const tooltipText = btn.getAttribute("data-name") || "Tooltip";
            btn.setAttribute("data-tooltip", tooltipText);
        }

        // Đảm bảo có class tooltip
        if (!btn.classList.contains("tooltip")) {
            btn.classList.add("tooltip");
        }
    });

    // Khởi tạo tooltip
    initTooltip();
});

document.querySelector(".hits-grid").addEventListener("click", (e) => {
    const card = e.target.closest(".hit-card, .artist-card");
    if (!card) return;
    handleDetailClick(card);
});

document.querySelector(".artists-grid").addEventListener("click", (e) => {
    const card = e.target.closest(".artist-card");
    if (!card) return;
    handleDetailClick(card);
});

document.addEventListener("DOMContentLoaded", async function () {
    initBackToHome();

    initSidebar();
    searchInSidebar();

    await showPlaylistFollowed(); // render playlists followed
    await showMyPlaylist(); // render liked + user playlists

    // Bind events sau khi render xong
    initPlaylists();
    initEditPlaylistUI();
    initContextMenu();
    filterButtons();
});
