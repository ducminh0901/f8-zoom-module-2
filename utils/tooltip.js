export function initTooltip() {
    const buttons = document.querySelectorAll(
        ".control-btn, .add-btn, .home-btn, .search-library-btn, .create-btn"
    );

    buttons.forEach((btn) => {
        btn.addEventListener("mouseenter", () => {
            let span = btn.querySelector(".tooltip-text");
            if (!span) {
                span = document.createElement("span");
                span.className = "tooltip-text";
                btn.appendChild(span);
            }

            // Cập nhật text tooltip từ data-tooltip
            span.textContent = btn.getAttribute("data-tooltip");

            // Check vị trí viewport để hiện trên/dưới
            const rect = btn.getBoundingClientRect();
            if (rect.top < 50) {
                span.classList.add("tooltip-bottom");
            } else {
                span.classList.remove("tooltip-bottom");
            }

            span.style.opacity = "1";
        });

        btn.addEventListener("mouseleave", () => {
            const span = btn.querySelector(".tooltip-text");
            if (span) span.style.opacity = "0";
        });
    });
}
