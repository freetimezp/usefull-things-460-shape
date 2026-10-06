gsap.registerPlugin();

/* =========================================================
   ELEMENTS
========================================================= */

const $ = (selector) => document.querySelector(selector);

const stage = $("#stage");
const shapeWrap = $("#shapeWrap");
const shapeRig = $("#shapeRig");
const shapeFace = $("#shapeFace");
const shapeDepth = $("#shapeDepth");
const shapeShadow = $("#shapeShadow");
const shapeBack = $(".shape-back");
const faceGlare = $("#faceGlare");

const rotationInput = $("#rotation");
const depthInput = $("#depth");
const shadowInput = $("#shadow");

const rotationValue = $("#rotationValue");
const depthValue = $("#depthValue");
const shadowValue = $("#shadowValue");

const coordX = $("#coordX");
const coordY = $("#coordY");

const layersToggle = $("#layersToggle");
const autoToggle = $("#autoToggle");
const resetBtn = $("#resetBtn");
const randomBtn = $("#randomBtn");

const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
).matches;

/* =========================================================
   STATE
========================================================= */

const defaults = {
    rotation: 35,
    depth: 28,
    shadow: 45,
    color: "#5c8dff",
    colorName: "ELECTRIC BLUE",
    layers: true,
    auto: false,
};

let state = { ...defaults };

let pointerX = 0;
let pointerY = 0;
let pointerInside = false;

let currentTiltX = 0;
let currentTiltY = 0;

let autoTween = null;
let pointerFrame = null;

/* =========================================================
   HELPERS
========================================================= */

function hexToRgb(hex) {
    const value = hex.replace("#", "");

    return {
        r: parseInt(value.substring(0, 2), 16),
        g: parseInt(value.substring(2, 4), 16),
        b: parseInt(value.substring(4, 6), 16),
    };
}

function setAccent(color) {
    const { r, g, b } = hexToRgb(color);

    document.documentElement.style.setProperty("--accent", color);
    document.documentElement.style.setProperty(
        "--accent-rgb",
        `${r}, ${g}, ${b}`,
    );
}

function updateRangeFill(input) {
    const min = Number(input.min);
    const max = Number(input.max);
    const value = Number(input.value);

    const percent = ((value - min) / (max - min)) * 100;

    input.style.setProperty("--fill", `${percent}%`);
}

function updateCoordinates() {
    coordX.textContent = `−${state.rotation}°`;
    coordY.textContent = `${Math.round(state.rotation * 0.69)}°`;
}

function updateControlLabels() {
    rotationValue.textContent = `${state.rotation}°`;
    depthValue.textContent = state.depth;
    shadowValue.textContent = `${state.shadow}%`;

    updateRangeFill(rotationInput);
    updateRangeFill(depthInput);
    updateRangeFill(shadowInput);

    updateCoordinates();
}

/* =========================================================
   GEOMETRY
========================================================= */

function updateGeometry(animate = true) {
    const duration = animate ? 0.5 : 0;

    const skew = state.rotation * 0.69;
    const extrusion = state.depth;

    gsap.to(shapeFace, {
        rotation: -state.rotation,
        skewY: skew,
        duration,
        ease: "power3.out",
        overwrite: true,
    });

    gsap.to(shapeBack, {
        rotation: -state.rotation,
        skewY: skew,
        x: -extrusion * 0.24,
        y: extrusion * 0.24,
        duration,
        ease: "power3.out",
        overwrite: true,
    });

    gsap.to(shapeDepth, {
        rotation: -state.rotation,
        skewY: skew,
        duration,
        ease: "power3.out",
        overwrite: true,
    });

    gsap.to(shapeShadow, {
        rotation: -state.rotation,
        skewY: skew,
        x: -12 - extrusion * 0.18,
        y: 24 + extrusion * 0.38,
        opacity: state.shadow / 100,
        filter: `blur(${10 + state.shadow * 0.2}px)`,
        duration,
        ease: "power3.out",
        overwrite: true,
    });

    shapeDepth.style.opacity = state.layers ? "1" : "0";
    shapeBack.style.opacity = state.layers ? "1" : "0";

    shapeFace.style.setProperty("--depth", `${extrusion}px`);

    gsap.to(shapeFace, {
        z: 20 + extrusion * 0.15,
        duration,
        ease: "power3.out",
        overwrite: true,
    });

    gsap.to(shapeDepth, {
        z: -extrusion * 0.2,
        duration,
        ease: "power3.out",
        overwrite: true,
    });

    updateControlLabels();
}

/* =========================================================
   COLOR SYSTEM
========================================================= */

function changeColor(color, name, button) {
    state.color = color;
    state.colorName = name;

    setAccent(color);

    $("#colorName").textContent = name;

    document.querySelectorAll(".swatch").forEach((swatch) => {
        const active = swatch === button;

        swatch.classList.toggle("active", active);
        swatch.setAttribute("aria-pressed", String(active));
    });

    gsap.fromTo(
        shapeFace,
        { filter: "brightness(1.35)" },
        {
            filter: "brightness(1)",
            duration: 0.65,
            ease: "power2.out",
        },
    );

    gsap.fromTo(
        $(".brand-symbol"),
        { rotation: -45, scale: 0.7 },
        {
            rotation: 0,
            scale: 1,
            duration: 0.65,
            ease: "back.out(2)",
        },
    );
}

document.querySelectorAll(".swatch").forEach((button) => {
    button.addEventListener("click", () => {
        changeColor(button.dataset.color, button.dataset.name, button);
    });
});

/* =========================================================
   SLIDER CONTROLS
========================================================= */

rotationInput.addEventListener("input", () => {
    state.rotation = Number(rotationInput.value);
    updateGeometry();
});

depthInput.addEventListener("input", () => {
    state.depth = Number(depthInput.value);
    updateGeometry();
});

shadowInput.addEventListener("input", () => {
    state.shadow = Number(shadowInput.value);
    updateGeometry();
});

/* =========================================================
   DIMENSIONAL LAYERS
========================================================= */

layersToggle.addEventListener("click", () => {
    state.layers = !state.layers;

    layersToggle.classList.toggle("active", state.layers);
    layersToggle.setAttribute("aria-pressed", String(state.layers));

    gsap.to([shapeDepth, shapeBack], {
        opacity: state.layers ? 1 : 0,
        duration: 0.4,
        ease: "power2.out",
        overwrite: true,
    });
});

/* =========================================================
   MOUSE INTERACTION
========================================================= */

const quickTiltX = gsap.quickTo(shapeRig, "rotationX", {
    duration: 0.7,
    ease: "power3.out",
});

const quickTiltY = gsap.quickTo(shapeRig, "rotationY", {
    duration: 0.7,
    ease: "power3.out",
});

const quickGlareX = gsap.quickTo(faceGlare, "x", {
    duration: 0.5,
    ease: "power2.out",
});

const quickGlareY = gsap.quickTo(faceGlare, "y", {
    duration: 0.5,
    ease: "power2.out",
});

stage.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "touch") return;

    pointerInside = true;
});

stage.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;

    const rect = stage.getBoundingClientRect();

    pointerX = (event.clientX - rect.left) / rect.width - 0.5;
    pointerY = (event.clientY - rect.top) / rect.height - 0.5;

    if (pointerFrame) return;

    pointerFrame = requestAnimationFrame(() => {
        pointerFrame = null;

        if (!pointerInside || state.auto) return;

        currentTiltX = -pointerY * 13;
        currentTiltY = pointerX * 17;

        quickTiltX(currentTiltX);
        quickTiltY(currentTiltY);

        quickGlareX(pointerX * 65);
        quickGlareY(pointerY * 65);
    });
});

stage.addEventListener("pointerleave", () => {
    pointerInside = false;

    if (pointerFrame) {
        cancelAnimationFrame(pointerFrame);
        pointerFrame = null;
    }

    currentTiltX = 0;
    currentTiltY = 0;

    quickTiltX(0);
    quickTiltY(0);

    quickGlareX(0);
    quickGlareY(0);
});

/* =========================================================
   FLOATING ANIMATION
========================================================= */

if (!reducedMotion) {
    gsap.to(shapeWrap, {
        y: -12,
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
    });

    gsap.to(".orbit-one", {
        rotation: 335,
        duration: 35,
        repeat: -1,
        ease: "none",
    });

    gsap.to(".orbit-two", {
        rotation: -328,
        duration: 45,
        repeat: -1,
        ease: "none",
    });

    gsap.to(".face-symbol", {
        rotation: 90,
        duration: 18,
        repeat: -1,
        ease: "none",
    });
}

/* =========================================================
   AUTO ROTATION
========================================================= */

function toggleAutoRotation(enabled) {
    state.auto = enabled;

    autoToggle.classList.toggle("active", enabled);
    autoToggle.setAttribute("aria-pressed", String(enabled));

    if (autoTween) {
        autoTween.kill();
        autoTween = null;
    }

    if (!enabled) {
        quickTiltX(0);
        quickTiltY(0);
        return;
    }

    pointerInside = false;

    autoTween = gsap.to(shapeRig, {
        rotationY: "+=360",
        rotationX: 8,
        duration: 12,
        repeat: -1,
        ease: "none",
        onRepeat() {
            gsap.set(shapeRig, { rotationY: 0 });
        },
    });
}

autoToggle.addEventListener("click", () => {
    toggleAutoRotation(!state.auto);
});

/* =========================================================
   GENERATE NEW FORM
========================================================= */

function generateForm() {
    const previousRotation = state.rotation;

    let nextRotation;

    do {
        nextRotation = Math.floor(Math.random() * 46) + 15;
    } while (nextRotation === previousRotation);

    state.rotation = nextRotation;
    state.depth = Math.floor(Math.random() * 50) + 10;
    state.shadow = Math.floor(Math.random() * 70) + 20;

    rotationInput.value = state.rotation;
    depthInput.value = state.depth;
    shadowInput.value = state.shadow;

    const swatches = [...document.querySelectorAll(".swatch")];
    const selected = swatches[Math.floor(Math.random() * swatches.length)];

    changeColor(selected.dataset.color, selected.dataset.name, selected);

    gsap.timeline()
        .to(shapeRig, {
            scale: 0.75,
            rotationZ: 8,
            duration: 0.2,
            ease: "power2.in",
        })
        .add(() => {
            updateGeometry(false);
        })
        .to(shapeRig, {
            scale: 1,
            rotationZ: 0,
            duration: 0.8,
            ease: "elastic.out(1, 0.65)",
        });

    gsap.fromTo(
        ".stage-grid",
        { opacity: 0.1 },
        { opacity: 1, duration: 0.8, ease: "power2.out" },
    );
}

randomBtn.addEventListener("click", generateForm);

/* =========================================================
   RESET STUDIO
========================================================= */

function resetStudio() {
    state = { ...defaults };

    rotationInput.value = state.rotation;
    depthInput.value = state.depth;
    shadowInput.value = state.shadow;

    toggleAutoRotation(false);

    layersToggle.classList.add("active");
    layersToggle.setAttribute("aria-pressed", "true");

    document.querySelectorAll(".swatch").forEach((button) => {
        const active = button.dataset.color === defaults.color;

        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
    });

    setAccent(defaults.color);
    $("#colorName").textContent = defaults.colorName;

    updateGeometry();

    gsap.to(shapeRig, {
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        scale: 1,
        duration: 0.8,
        ease: "elastic.out(1, 0.7)",
        overwrite: true,
    });
}

resetBtn.addEventListener("click", resetStudio);

/* =========================================================
   INTRO REVEAL
========================================================= */

if (reducedMotion) {
    gsap.set(".reveal", { opacity: 1, y: 0 });
} else {
    gsap.to(".reveal", {
        opacity: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
        delay: 0.15,
    });

    gsap.from(".studio", {
        opacity: 0,
        y: 25,
        duration: 1,
        delay: 0.35,
        ease: "power3.out",
    });

    gsap.from(".control-panel > *", {
        opacity: 0,
        x: 15,
        duration: 0.65,
        stagger: 0.07,
        delay: 0.65,
        ease: "power2.out",
    });
}

/* =========================================================
   INITIALIZE
========================================================= */

updateGeometry(false);
updateControlLabels();
