const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const itemsInput = document.getElementById("itemsInput");
const spinButton = document.getElementById("spinButton");
const updateButton = document.getElementById("updateButton");
const resetButton = document.getElementById("resetButton");
const removeWinnerButton = document.getElementById("removeWinnerButton");
const result = document.getElementById("result");
const message = document.getElementById("message");

const initialItems = ["ごはん", "ラーメン", "カレー", "寿司", "焼肉", "パスタ"];
const palette = ["#ec4899", "#8b5cf6", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#6366f1"];

let items = [...initialItems];
let rotation = 0;
let isSpinning = false;
let lastWinnerIndex = null;

function normalizeItems(value) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean).slice(0, 30);
}

function fitText(text, maxLength = 12) {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1)}…`;
}

function drawWheel() {
  const size = canvas.width;
  const center = size / 2;
  const radius = center - 16;
  ctx.clearRect(0, 0, size, size);

  if (items.length === 0) {
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#334155";
    ctx.fill();
    ctx.fillStyle = "#f8fafc";
    ctx.font = "700 34px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("候補を追加してね", center, center);
    return;
  }

  const segmentAngle = (Math.PI * 2) / items.length;
  items.forEach((item, index) => {
    const start = rotation + index * segmentAngle - Math.PI / 2;
    const end = start + segmentAngle;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = palette[index % palette.length];
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(start + segmentAngle / 2);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 ${items.length > 12 ? 20 : 27}px sans-serif`;
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 4;
    ctx.fillText(fitText(item), radius - 28, 0);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(center, center, 48, 0, Math.PI * 2);
  ctx.fillStyle = "#f8fafc";
  ctx.fill();
  ctx.strokeStyle = "rgba(15,23,42,0.35)";
  ctx.lineWidth = 8;
  ctx.stroke();
}

function setItems(nextItems) {
  items = nextItems;
  rotation = 0;
  lastWinnerIndex = null;
  removeWinnerButton.disabled = true;
  spinButton.disabled = items.length < 2;
  result.textContent = items.length < 2 ? "候補を2つ以上入れてね" : "結果がここに表示されるよ";
  drawWheel();
}

function showMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? "#fda4af" : "#86efac";
}

function updateItems() {
  const nextItems = normalizeItems(itemsInput.value);
  if (nextItems.length < 2) {
    showMessage("候補は2つ以上入れてね。", true);
    return;
  }
  itemsInput.value = nextItems.join("\n");
  setItems(nextItems);
  showMessage(`${nextItems.length}個の候補を反映したよ！`);
}

function spin() {
  if (isSpinning || items.length < 2) return;
  isSpinning = true;
  spinButton.disabled = true;
  removeWinnerButton.disabled = true;
  result.textContent = "回転中…";
  const startRotation = rotation;
  const extraTurns = 5 + Math.random() * 3;
  const randomOffset = Math.random() * Math.PI * 2;
  const targetRotation = startRotation + extraTurns * Math.PI * 2 + randomOffset;
  const duration = 4200;
  const startTime = performance.now();

  function animate(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    rotation = startRotation + (targetRotation - startRotation) * eased;
    drawWheel();
    if (progress < 1) {
      requestAnimationFrame(animate);
      return;
    }
    rotation %= Math.PI * 2;
    const segmentAngle = (Math.PI * 2) / items.length;
    const normalized = ((-rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    lastWinnerIndex = Math.floor((normalized + segmentAngle / 2) / segmentAngle) % items.length;
    result.textContent = `🎉 ${items[lastWinnerIndex]}！`;
    isSpinning = false;
    spinButton.disabled = false;
    removeWinnerButton.disabled = false;
    if ("vibrate" in navigator) navigator.vibrate([80, 40, 120]);
  }
  requestAnimationFrame(animate);
}

function removeWinner() {
  if (lastWinnerIndex === null || items.length <= 2) {
    showMessage("候補は最低2つ必要だよ。", true);
    return;
  }
  const removed = items[lastWinnerIndex];
  items.splice(lastWinnerIndex, 1);
  itemsInput.value = items.join("\n");
  setItems([...items]);
  showMessage(`「${removed}」を削除したよ。`);
}

function reset() {
  itemsInput.value = initialItems.join("\n");
  setItems([...initialItems]);
  showMessage("初期状態に戻したよ！");
}

spinButton.addEventListener("click", spin);
updateButton.addEventListener("click", updateItems);
removeWinnerButton.addEventListener("click", removeWinner);
resetButton.addEventListener("click", reset);
drawWheel();
