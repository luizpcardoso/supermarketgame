document.addEventListener('DOMContentLoaded', () => {
  const TIME_LIMIT = 20;
  const SHOPPING_LIST_SIZE = 5;

  const ALL_PRODUCTS = [
    { id: 'aveia', name: 'Aveia', image: 'imagens/aveia.jpeg' },
    { id: 'biscoitos', name: 'Biscoitos', image: 'imagens/biscoito.jpeg' },
    { id: 'chips', name: 'Chips', image: 'imagens/chips.jpeg' },
    { id: 'creme-dental', name: 'Creme dental', image: 'imagens/creme-dental.jpeg' },
    { id: 'limpador', name: 'Limpador', image: 'imagens/limpador.jpeg' },
    { id: 'macarrao', name: 'Macarrão', image: 'imagens/macarrão.jpeg' },
    { id: 'oleo', name: 'Óleo', image: 'imagens/oleo.jpeg' },
    { id: 'molho', name: 'Molho de tomate', image: 'imagens/molho-de-tomate.jpeg' },
    { id: 'suco', name: 'Suco', image: 'imagens/suco.jpeg' },
    { id: 'sabao', name: 'Sabão', image: 'imagens/sabão.jpeg' },
    { id: 'shampoo', name: 'Shampoo', image: 'imagens/shampoo.jpeg' }
  ];

  const GRID_ROWS = 5;
  const GRID_COLUMNS = 7;
  const TOTAL_SLOTS = GRID_ROWS * GRID_COLUMNS;

  const shoppingListElement = document.querySelector('#shopping-list');
  const statusTextElement = document.querySelector('#status-text');
  const timerValueElement = document.querySelector('#timer-value');
  const restartButton = document.querySelector('#restart-btn');
  const productsContainer = document.querySelector('#products');

  let targets = [];
  let targetIds = new Set();
  let foundTargets = new Set();
  let timeRemaining = TIME_LIMIT;
  let countdownId = null;
  let isGameActive = false;

  restartButton.addEventListener('click', initializeGame);

  initializeGame();

  function initializeGame() {
    clearInterval(countdownId);
    targets = getRandomProducts(ALL_PRODUCTS, SHOPPING_LIST_SIZE);
    targetIds = new Set(targets.map((item) => item.id));
    foundTargets = new Set();
    timeRemaining = TIME_LIMIT;
    isGameActive = true;

    updateTimerDisplay();
    renderShoppingList();
    renderProducts();
    updateStatus('Clique nos produtos da lista para adicioná-los ao carrinho.');

    startCountdown();
  }

  function renderProducts() {
    const shelfProducts = generateShelfProducts();
    productsContainer.innerHTML = '';

    shelfProducts.forEach((product) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'product';
      button.dataset.productId = product.id;
      button.dataset.productName = product.name;
      button.setAttribute('aria-label', product.name);

      const image = document.createElement('img');
      image.src = product.image;
      image.alt = product.name;
      button.append(image);

      button.addEventListener('click', handleProductClick);
      productsContainer.append(button);
    });
  }

  function generateShelfProducts() {
    const shelfProducts = [...targets];

    while (shelfProducts.length < TOTAL_SLOTS) {
      const randomIndex = Math.floor(Math.random() * ALL_PRODUCTS.length);
      shelfProducts.push(ALL_PRODUCTS[randomIndex]);
    }

    return shuffle(shelfProducts).slice(0, TOTAL_SLOTS);
  }

  function renderShoppingList() {
    shoppingListElement.innerHTML = '';
    targets.forEach((product) => {
      const listItem = document.createElement('li');
      listItem.dataset.productId = product.id;
      listItem.textContent = product.name;
      shoppingListElement.append(listItem);
    });
  }

  function handleProductClick(event) {
    if (!isGameActive) {
      return;
    }

    const button = event.currentTarget;
    const productId = button.dataset.productId;

    if (foundTargets.has(productId)) {
      return;
    }

    if (targetIds.has(productId)) {
      foundTargets.add(productId);
      markButtonsAsFound(productId);

      const listItem = shoppingListElement.querySelector(`li[data-product-id="${productId}"]`);
      if (listItem) {
        listItem.classList.add('found');
      }

      updateStatus(`Ótimo! Você encontrou ${button.dataset.productName}.`, 'success');

      if (foundTargets.size === targetIds.size) {
        endGame(true);
      }
    } else {
      button.classList.add('wrong');
      updateStatus('Esse item não está na lista de compras.', 'error');
      window.setTimeout(() => button.classList.remove('wrong'), 400);
    }
  }

  function startCountdown() {
    countdownId = window.setInterval(() => {
      timeRemaining -= 1;
      updateTimerDisplay();

      if (timeRemaining <= 0) {
        endGame(false);
      }
    }, 1000);
  }

  function endGame(playerWon) {
    if (!isGameActive) {
      return;
    }

    isGameActive = false;
    clearInterval(countdownId);

    if (!playerWon && timeRemaining < 0) {
      timeRemaining = 0;
      updateTimerDisplay();
    }

    disableProducts();

    if (playerWon) {
      updateStatus('Parabéns! Você encontrou todos os itens a tempo!', 'success');
    } else {
      updateStatus('Tempo esgotado! Tente novamente para completar a lista.', 'error');
      markMissingItems();
    }
  }

  function disableProducts() {
    productsContainer.querySelectorAll('.product').forEach((button) => {
      button.disabled = true;
    });
  }

  function markButtonsAsFound(productId) {
    productsContainer
      .querySelectorAll(`.product[data-product-id="${productId}"]`)
      .forEach((button) => {
        button.classList.add('found');
        button.disabled = true;
      });
  }

  function markMissingItems() {
    shoppingListElement.querySelectorAll('li').forEach((item) => {
      if (!foundTargets.has(item.dataset.productId)) {
        item.classList.add('missed');
      }
    });
  }

  function updateTimerDisplay() {
    if (timeRemaining <= 0) {
      timeRemaining = 0;
    }
    timerValueElement.textContent = timeRemaining.toString().padStart(2, '0');
    const timerDisplay = timerValueElement.closest('.timer-display');
    if (!timerDisplay) return;
    if (timeRemaining <= 5) {
      timerDisplay.classList.add('warning');
    } else {
      timerDisplay.classList.remove('warning');
    }
  }

  function updateStatus(message, state = 'neutral') {
    statusTextElement.textContent = message;
    statusTextElement.classList.remove('success', 'error');

    if (state === 'success') {
      statusTextElement.classList.add('success');
    }

    if (state === 'error') {
      statusTextElement.classList.add('error');
    }
  }

  function getRandomProducts(products, amount) {
    const shuffled = shuffle([...products]);
    return shuffled.slice(0, amount);
  }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
});
