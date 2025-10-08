export function initTooltip() {
    const buttons = document.querySelectorAll(".control-btn");
    const addBtns = document.querySelectorAll(".add-btn");

    buttons.forEach((btn) => {
        btn.addEventListener("mouseenter", () => {
            let span = btn.querySelector(".tooltip-text");
            if (!span) {
                span = document.createElement("span");
                span.className = "tooltip-text";
                btn.appendChild(span);
            }

            span.textContent = btn.getAttribute("data-tooltip");

            // Auto adjust nếu gần top viewport
            const rect = btn.getBoundingClientRect();
            if (rect.top < 50) {
                span.style.bottom = "auto";
                span.style.top = "125%";
            } else {
                span.style.top = "";
                span.style.bottom = "125%";
            }

            span.style.opacity = "1";
        });

        btn.addEventListener("mouseleave", () => {
            const span = btn.querySelector(".tooltip-text");
            if (span) span.style.opacity = "0";
        });
    });

    addBtns.forEach((btn) => {
        btn.addEventListener("mouseenter", () => {
            let span = btn.querySelector(".tooltip-text");
            if (!span) {
                span = document.createElement("span");
                span.className = "tooltip-text";
                btn.appendChild(span);
            }
            span.textContent = btn.getAttribute("data-tooltip");
            span.style.opacity = "1";
        });

        btn.addEventListener("mouseleave", () => {
            const span = btn.querySelector(".tooltip-text");
            if (span) span.style.opacity = "0";
        });
    });
}
