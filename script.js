const PRODUCTS = [
  { id: "aveia", name: "Aveia", image: "imagens/aveia.jpeg" },
  { id: "biscoito", name: "Biscoito", image: "imagens/biscoito.jpeg" },
  { id: "chips", name: "Chips", image: "imagens/chips.jpeg" },
  { id: "creme-dental", name: "Creme dental", image: "imagens/creme-dental.jpeg" },
  { id: "limpador", name: "Limpador", image: "imagens/limpador.jpeg" },
  { id: "macarrao", name: "Macarrão", image: "imagens/macarrão.jpeg" },
  { id: "molho", name: "Molho de tomate", image: "imagens/molho-de-tomate.jpeg" },
  { id: "oleo", name: "Óleo", image: "imagens/oleo.jpeg" },
  { id: "sabao", name: "Sabão", image: "imagens/sabão.jpeg" },
  { id: "shampoo", name: "Shampoo", image: "imagens/shampoo.jpeg" },
  { id: "suco", name: "Suco", image: "imagens/suco.jpeg" }
];

const GRID_ROWS = 5;
const GRID_COLUMNS = 7;
const TOTAL_SLOTS = GRID_ROWS * GRID_COLUMNS;
const TARGET_COUNT = 5;
const DEFAULT_DURATION = 20;
const MIN_DURATION = 5;
const MAX_DURATION = 600;

const shelfGrid = document.getElementById("shelf-grid");
const shoppingList = document.getElementById("shopping-list");
const timerElement = document.getElementById("timer");
const statusMessage = document.getElementById("status-message");
const startButton = document.getElementById("start-button");
const timeInput = document.getElementById("time-input");
const resultModal = document.getElementById("result-modal");
const modalContent = document.getElementById("modal-content");
const modalTitle = document.getElementById("modal-title");
const modalMessage = document.getElementById("modal-message");
const modalSummary = document.getElementById("modal-summary");
const modalPlayAgainButton = document.getElementById("modal-play-again");
const modalDismissElements = document.querySelectorAll("[data-dismiss-modal]");
const startButtonDefaultLabel = startButton.textContent.trim();

let activeTargets = [];
let foundTargets = new Set();
let roundInterval = null;
let roundDuration = DEFAULT_DURATION;
let timeRemaining = DEFAULT_DURATION;
let roundActive = false;

function setRoundControlsActive(isActive) {
  startButton.disabled = isActive;
  startButton.textContent = isActive
    ? "Rodada em andamento..."
    : startButtonDefaultLabel;
  timeInput.disabled = isActive;
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function prepareRound(duration = roundDuration) {
  clearInterval(roundInterval);
  roundInterval = null;
  roundActive = false;
  roundDuration = duration;
  timeRemaining = duration;
  foundTargets.clear();

  activeTargets = shuffle(PRODUCTS).slice(0, TARGET_COUNT);
  renderShoppingList();
  renderShelf();
  updateTimerDisplay();
  statusMessage.textContent =
    "Assim que o tempo começar a contar, encontre os itens destacados na lista.";
}

function renderShoppingList() {
  shoppingList.innerHTML = "";
  activeTargets.forEach((product) => {
    const item = document.createElement("li");
    item.dataset.productId = product.id;
    item.textContent = product.name;
    shoppingList.appendChild(item);
  });
}

function renderShelf() {
  const requiredItems = activeTargets.map((product) => ({ ...product }));
  const slots = [...requiredItems];

  while (slots.length < TOTAL_SLOTS) {
    const randomProduct = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    slots.push(randomProduct);
  }

  const shuffledSlots = shuffle(slots);
  shelfGrid.innerHTML = "";

  shuffledSlots.forEach((product) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "product-card";
    button.dataset.productId = product.id;
    button.setAttribute("aria-label", product.name);

    const image = document.createElement("img");
    image.src = product.image;
    image.alt = product.name;

    button.appendChild(image);
    button.addEventListener("click", handleProductClick);
    shelfGrid.appendChild(button);
  });
}

function updateTimerDisplay() {
  const totalSeconds = Math.max(timeRemaining, 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formatted = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
  timerElement.textContent = formatted;
}

function startRound() {
  if (roundActive) {
    return;
  }

  closeResultModal({ restoreFocus: false });

  const duration = sanitizeDuration(timeInput.value);
  timeInput.value = duration;

  prepareRound(duration);
  roundActive = true;
  setRoundControlsActive(true);
  const secondsLabel = duration === 1 ? "1 segundo" : `${duration} segundos`;
  statusMessage.textContent = `Boa sorte! Você tem ${secondsLabel}.`;

  if (roundInterval) {
    clearInterval(roundInterval);
  }

  roundInterval = setInterval(() => {
    timeRemaining -= 1;
    updateTimerDisplay();

    if (timeRemaining <= 0) {
      finishRound(false);
    }
  }, 1000);
}

function handleProductClick(event) {
  if (!roundActive) {
    return;
  }

  const button = event.currentTarget;
  const productId = button.dataset.productId;

  if (foundTargets.has(productId)) {
    return;
  }

  const isTarget = activeTargets.some((item) => item.id === productId);

  if (isTarget) {
    foundTargets.add(productId);
    markProductAsFound(productId);
    statusMessage.textContent = `Você encontrou ${button.getAttribute("aria-label")}.`;

    if (foundTargets.size === activeTargets.length) {
      finishRound(true);
    }
  } else {
    button.classList.add("missed");
    statusMessage.textContent = "Esse item não está na lista. Continue procurando!";
    setTimeout(() => button.classList.remove("missed"), 350);
  }
}

function markProductAsFound(productId) {
  const listItem = shoppingList.querySelector(`[data-product-id="${productId}"]`);
  if (listItem) {
    listItem.classList.add("found");
  }

  const matchingButtons = shelfGrid.querySelectorAll(`[data-product-id="${productId}"]`);
  matchingButtons.forEach((btn) => {
    btn.classList.add("found");
    btn.setAttribute("aria-disabled", "true");
  });
}

function finishRound(playerWon) {
  if (!roundActive) {
    return;
  }

  roundActive = false;
  clearInterval(roundInterval);
  roundInterval = null;
  timeRemaining = Math.max(timeRemaining, 0);
  updateTimerDisplay();
  setRoundControlsActive(false);

  const message = playerWon
    ? "Excelente trabalho! Você encontrou todos os itens a tempo."
    : 'O tempo acabou! Clique em "Jogar novamente" para tentar outra vez.';
  statusMessage.textContent = message;

  shelfGrid
    .querySelectorAll(".product-card")
    .forEach((button) => button.setAttribute("aria-disabled", "true"));
  openResultModal(playerWon);
}

function isModalOpen() {
  return resultModal && !resultModal.hasAttribute("hidden");
}

function closeResultModal({ restoreFocus = true } = {}) {
  if (!resultModal || !isModalOpen()) {
    return;
  }

  resultModal.setAttribute("aria-hidden", "true");
  resultModal.setAttribute("hidden", "");
  document.body.classList.remove("modal-open");

  if (restoreFocus) {
    startButton.focus({ preventScroll: true });
  }
}

function openResultModal(playerWon) {
  if (!resultModal) {
    return;
  }

  const missingCount = activeTargets.length - foundTargets.size;
  const hasPartialFinds = foundTargets.size > 0 && missingCount > 0;

  if (modalContent) {
    modalContent.dataset.result = playerWon ? "win" : "lose";
  }

  if (modalTitle) {
    modalTitle.textContent = playerWon
      ? "Você venceu!"
      : "Tempo esgotado";
  }

  if (modalMessage) {
    if (playerWon) {
      modalMessage.textContent =
        "Excelente! Você encontrou todos os itens da lista dentro do tempo.";
    } else if (missingCount === 0) {
      modalMessage.textContent =
        "Você encontrou todos os itens, mas o cronômetro chegou ao fim.";
    } else {
      const itemLabel = missingCount === 1 ? "item" : "itens";
      modalMessage.textContent = hasPartialFinds
        ? `Faltou ${missingCount} ${itemLabel} para completar a lista.`
        : "O tempo acabou antes de encontrar algum item. Que tal tentar outra vez?";
    }
  }

  if (modalSummary) {
    modalSummary.innerHTML = "";
    activeTargets.forEach((product) => {
      const listItem = document.createElement("li");
      const isFound = foundTargets.has(product.id);

      listItem.className = isFound ? "found" : "missing";

      const nameSpan = document.createElement("span");
      nameSpan.className = "modal-summary-name";
      nameSpan.textContent = product.name;

      const statusSpan = document.createElement("span");
      statusSpan.className = "modal-summary-status";
      statusSpan.textContent = isFound ? "Encontrado" : "Faltou";

      listItem.append(nameSpan, statusSpan);
      modalSummary.appendChild(listItem);
    });
  }

  resultModal.removeAttribute("hidden");
  resultModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  if (modalPlayAgainButton) {
    modalPlayAgainButton.focus({ preventScroll: true });
  }
}

startButton.addEventListener("click", () => {
  startRound();
});

timeInput.addEventListener("change", () => {
  const sanitized = sanitizeDuration(timeInput.value);
  timeInput.value = sanitized;

  if (!roundActive) {
    roundDuration = sanitized;
    timeRemaining = sanitized;
    updateTimerDisplay();
  }
});

modalDismissElements.forEach((element) => {
  element.addEventListener("click", () => {
    closeResultModal();
  });
});

if (modalPlayAgainButton) {
  modalPlayAgainButton.addEventListener("click", () => {
    closeResultModal({ restoreFocus: false });
    startRound();
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isModalOpen()) {
    event.preventDefault();
    closeResultModal();
  }
});

function sanitizeDuration(rawValue) {
  const parsed = Number.parseInt(rawValue, 10);

  if (Number.isNaN(parsed)) {
    return DEFAULT_DURATION;
  }

  return Math.min(Math.max(parsed, MIN_DURATION), MAX_DURATION);
}

const initialDuration = sanitizeDuration(timeInput.value || DEFAULT_DURATION);
timeInput.value = initialDuration;
roundDuration = initialDuration;
timeRemaining = initialDuration;
updateTimerDisplay();
renderShelf();
statusMessage.textContent =
  'Defina a duração da rodada e clique em "Iniciar jogo" para começar.';
setRoundControlsActive(false);
