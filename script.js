/* =========================
   タイマー設定
========================= */

let selectedDuration = 0;
let remainingSeconds = 0;

let timer = null;
let isRunning = false;

let endTime = null;

/* =========================
   7セグメントの数字
========================= */

const numbers = {
    0: ["a", "b", "c", "d", "e", "f"],
    1: ["b", "c"],
    2: ["a", "b", "d", "e", "g"],
    3: ["a", "b", "c", "d", "g"],
    4: ["b", "c", "f", "g"],
    5: ["a", "c", "d", "f", "g"],
    6: ["a", "c", "d", "e", "f", "g"],
    7: ["a", "b", "c"],
    8: ["a", "b", "c", "d", "e", "f", "g"],
    9: ["a", "b", "c", "d", "f", "g"]
};

/* =========================
   数字を表示する
========================= */

function showDigit(id, number) {
    const digit = document.getElementById(id);
    const segments = digit.querySelectorAll(".segment");

    segments.forEach(segment => segment.classList.remove("on"));

    numbers[number].forEach(name => {
        const segment = digit.querySelector("." + name);
        segment.classList.add("on");
    });
}

/* =========================
   色変更（追加）
========================= */

function updateColors() {
    if (selectedDuration === 0) return;

    const ratio = remainingSeconds / selectedDuration;

    if (ratio <= 0.10) {
        document.documentElement.style.setProperty("--color-on", "var(--color-on-danger)");
        document.documentElement.style.setProperty("--color-glow", "var(--color-glow-danger)");
    }
    else if (ratio <= 0.50) {
        document.documentElement.style.setProperty("--color-on", "var(--color-on-warning)");
        document.documentElement.style.setProperty("--color-glow", "var(--color-glow-warning)");
    }
    else {
        document.documentElement.style.setProperty("--color-on", "var(--color-on-safe)");
        document.documentElement.style.setProperty("--color-glow", "var(--color-glow-safe)");
    }
}

/* =========================
   タイマー表示を更新
========================= */

function updateDisplay() {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    const minuteTens = Math.floor(minutes / 10);
    const minuteOnes = minutes % 10;

    const secondTens = Math.floor(seconds / 10);
    const secondOnes = seconds % 10;

    showDigit("digit1", minuteTens);
    showDigit("digit2", minuteOnes);
    showDigit("digit3", secondTens);
    showDigit("digit4", secondOnes);

    const progressBar = document.getElementById("progress-bar");

    if (selectedDuration > 0) {
        const percent = (remainingSeconds / selectedDuration) * 100;
        progressBar.style.width = percent + "%";
    } else {
        progressBar.style.width = "0%";
    }

    updateColors();
}

/* =========================
   タイマー更新
========================= */

function updateTimer() {
    if (!isRunning) return;

    const newRemainingSeconds =
        Math.max(0, Math.ceil((endTime - Date.now()) / 1000));

    if (newRemainingSeconds !== remainingSeconds) {
        remainingSeconds = newRemainingSeconds;
        updateDisplay();

        if (remainingSeconds <= 3 && remainingSeconds > 0) {
            playBeep(0.2);
        }

        if (remainingSeconds === 0) {
            playBeep(1.0);
            finishTimer();
        }
    }
}

/* =========================
   START / PAUSE
========================= */

document.getElementById("start-button").addEventListener("click", () => {

    if (isRunning) {
        remainingSeconds = Math.max(
            0,
            Math.ceil((endTime - Date.now()) / 1000)
        );

        clearInterval(timer);
        timer = null;
        isRunning = false;
        endTime = null;

        document.getElementById("start-button").textContent = "RESUME";

        updateDisplay();
        return;
    }

    if (remainingSeconds <= 0) return;

    endTime = Date.now() + remainingSeconds * 1000;

    isRunning = true;

    document.getElementById("start-button").textContent = "PAUSE";

    updateTimer();

    timer = setInterval(updateTimer, 50);
});

/* =========================
   RESET
========================= */

document.getElementById("reset-button").addEventListener("click", () => {
    clearInterval(timer);
    timer = null;
    isRunning = false;
    endTime = null;

    remainingSeconds = selectedDuration;

    document.getElementById("start-button").textContent = "START";

    updateDisplay();
});

/* =========================
   時間設定
========================= */

const durationButtons = document.querySelectorAll(".duration-button");

durationButtons.forEach(button => {
    button.addEventListener("click", () => {

        const minutes = Number(button.dataset.minutes);

        selectedDuration = minutes * 60;
        remainingSeconds = selectedDuration;

        clearInterval(timer);
        timer = null;
        isRunning = false;
        endTime = null;

        durationButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");

        document.getElementById("start-button").textContent = "START";

        updateDisplay();
    });
});

/* =========================
   タイマー終了
========================= */

function finishTimer() {
    clearInterval(timer);
    timer = null;
    isRunning = false;
    endTime = null;

    document.getElementById("start-button").textContent = "DONE";

    document.getElementById("progress-bar").style.width = "0%";
}

/* =========================
   終了音
========================= */

let audioContext = null;

function playBeep(duration) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.frequency.value = 700;
    gain.gain.setValueAtTime(0.4, audioContext.currentTime);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
}

/* =========================
   最初の表示
========================= */

updateDisplay();
/* =========================
   AudioContext 初期化（ラグ防止）
========================= */

window.addEventListener("click", initAudioOnce, { once: true });

function initAudioOnce() {
    playBeep(0.001); // ほぼ無音の短いビープで初期化
}
