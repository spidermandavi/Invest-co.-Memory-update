let lastDividends = [];

// ===== SAVE SYSTEM =====
const SAVE_KEY = "investCoSave";

function saveGame() {
  const data = {
    players,
    currentPlayer,
    turn,
    actionTracker,
    gameMode,
    modeValue,
    stocks: stocks.map(s => ({
      name: s.name,
      price: s.price,
      volatility: s.volatility,
      dividend: s.dividend,
      owned: s.owned,
      totalSpent: s.totalSpent,
      history: s.history,
      desc: s.desc
    }))
  };

  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;

  const data = JSON.parse(raw);

  players = data.players;
  currentPlayer = data.currentPlayer;
  turn = data.turn;
  actionTracker = data.actionTracker;
  gameMode = data.gameMode;
  modeValue = data.modeValue;

  stocks = data.stocks;

  return true;
}

function hasSave() {
  return !!localStorage.getItem(SAVE_KEY);
}

function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}

// ===== GAME STATE =====
let players = [];
let currentPlayer = 0;
let turn = 1;
let actionTracker = {};

let gameMode = "turns";
let modeValue = 20;

let stocks = [
  { name: "KEPL3", price: 8.21, volatility: 0.20, dividend: 0.09, owned: {}, totalSpent: {}, desc: "Machinery, medium risk.9% div", history: [] },
  { name: "KLBN4", price: 3.94, volatility: 0.15, dividend: 0.06, owned: {}, totalSpent: {}, desc: "Paper, low risk.6% div", history: [] },
  { name: "ALUP4", price: 10.99, volatility: 0.12, dividend: 0.06, owned: {}, totalSpent: {}, desc: "Energy, low risk.6% div", history: [] },
  { name: "SAPR4", price: 8.51, volatility: 0.15, dividend: 0.05, owned: {}, totalSpent: {}, desc: "Water, low medium risk.5% div", history: [] },
  { name: "TASA4", price: 4.88, volatility: 0.35, dividend: 0.06, owned: {}, totalSpent: {}, desc: "Guns, high volatility.6% div", history: [] },
  { name: "POMO4", price: 6.20, volatility: 0.15, dividend: 0.09, owned: {}, totalSpent: {}, desc: "Buses, low medium risk.9% div", history: [] },
  { name: "GRND3", price: 4.74, volatility: 0.10, dividend: 0.1, owned: {}, totalSpent: {}, desc: "Shoes, low risk.10% div", history: [] },
  { name: "ROMI3", price: 7.15, volatility: 0.08, dividend: 0.1, owned: {}, totalSpent: {}, desc: "Machinery, low risk.10% div", history: [] },
  { name: "SOJA3", price: 7.13, volatility: 0.40, dividend: 0.02, owned: {}, totalSpent: {}, desc: "Seeds, high volatility.2% div", history: [] },
  { name: "FIQE3", price: 7.01, volatility: 0.25, dividend: 0.07, owned: {}, totalSpent: {}, desc: "Internet, medium risk.7% div", history: [] },
  { name: "BBSE3", price: 34.81, volatility: 0.10, dividend: 0.12, owned: {}, totalSpent: {}, desc: "Insurance, low medium risk.12% div", history: [] },
  { name: "CXSE3", price: 18.35, volatility: 0.10, dividend: 0.08, owned: {}, totalSpent: {}, desc: "Insurance, low medium risk.8% div", history: [] },
  { name: "BRBI11", price: 19.50, volatility: 0.28, dividend: 0.1, owned: {}, totalSpent: {}, desc: "Investment Bank, medium risk.10% div", history: [] },
  { name: "BMGB4", price: 5, volatility: 0.17, dividend: 0.1, owned: {}, totalSpent: {}, desc: "Bank, low medium risk.10% div", history: [] },
  { name: "CMIN3", price: 4.95, volatility: 0.30, dividend: 0.08, owned: {}, totalSpent: {}, desc: "Mining, high medium risk.8% div", history: [] },
  { name: "IFCM3", price: 1, volatility: 0.35, dividend: 0, owned: {}, totalSpent: {}, desc: "E-Commerce, low high risk.0% div", history: [] },
  { name: "PETR3", price: 53.91, volatility: 0.50, dividend: 0.08, owned: {}, totalSpent: {}, desc: "Petrolium, ultra high risk.8% div", history: [] },
  { name: "PRIO3", price: 66.21, volatility: 0.50, dividend: 0, owned: {}, totalSpent: {}, desc: "Petrolium, ultra high risk.0% div", history: [] }
];

let playerColors = ["#ff4c4c","#4caf50","#2196f3","#ff9800"];

// ===== START GAME =====
function startGame() {
  clearSave(); // NEW: overwrite old save

  let count = Number(document.getElementById("playerCount").value);
  gameMode = document.getElementById("gameMode").value;
  modeValue = Number(document.getElementById("modeValue").value) || 20;

  players = [];

  for (let i = 0; i < count; i++) {
    let nameInput = document.getElementById(`playerName${i}`);
    let name = nameInput?.value || `Player ${i+1}`;

    players.push({
      money: 1000,
      name,
      color: playerColors[i] || "#fff",
      history: [1000]
    });
  }

  stocks.forEach(s => {
    s.history = [s.price];
    players.forEach((_, i) => {
      s.owned[i] = 0;
      s.totalSpent[i] = 0;
    });
  });

  document.getElementById("setup").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  currentPlayer = 0;
  turn = 1;
  resetTurn();

  render();
  saveGame(); // NEW
}

// ===== AUTO SAVE HELPERS =====
function autoSave() {
  saveGame();
}

// ===== BUY / SELL (UPDATED) =====
function buy(i, amount) {
  if (actionTracker[i] === "sell") return popup("You cannot buy and sell the same stock in one turn!");

  let s = stocks[i];
  let cost = s.price * amount;

  if (players[currentPlayer].money < cost) return popup("Not enough money");

  players[currentPlayer].money -= cost;
  s.owned[currentPlayer] += amount;
  s.totalSpent[currentPlayer] += cost;

  actionTracker[i] = "buy";

  updatePlayerHistory(currentPlayer);
  render();
  saveGame();
}

function sell(i, amount = 1) {
  if (actionTracker[i] === "buy") return popup("You cannot buy and sell the same stock in one turn!");

  let s = stocks[i];
  let ownedAmount = Math.min(amount, s.owned[currentPlayer]);

  if (ownedAmount <= 0) return popup("No stocks to sell");

  s.owned[currentPlayer] -= ownedAmount;
  players[currentPlayer].money += s.price * ownedAmount;

  actionTracker[i] = "sell";

  updatePlayerHistory(currentPlayer);
  render();
  saveGame();
}

// ===== TURN SYSTEM =====
function endTurn() {
  currentPlayer++;

  if (currentPlayer >= players.length) {
    currentPlayer = 0;
    turn++;

    updateMarket();
    applyDividends();
    randomEvent();

    players.forEach((p, i) => updatePlayerHistory(i));
  }

  resetTurn();

  if (players[currentPlayer].money < 0) forceSell();

  checkWin();
  render();
  saveGame(); // NEW
}

// ===== MARKET =====
function updateMarket() {
  stocks.forEach(s => {
    let change = (Math.random()*2-1)*s.volatility*s.price;
    s.price += change;
    s.price = Math.max(1, Math.min(500, s.price));
    s.change = change;
    s.history.push(s.price);
  });

  saveGame(); // NEW
}

// ===== DIVIDENDS =====
function applyDividends() {
  lastDividends = players.map(() => []);

  players.forEach((p, pi) => {
    let playerDividends = [];

    stocks.forEach(s => {
      const owned = s.owned[pi];
      if (owned <= 0) return;

      const dividendAmount = owned * s.price * (s.dividend || 0);
      if (dividendAmount > 0) {
        playerDividends.push({ stock: s.name, amount: dividendAmount });
        p.money += dividendAmount;
      }
    });

    lastDividends[pi] = playerDividends;
  });

  saveGame(); // NEW (important)
}

// ===== RESET GAME =====
function resetGame(){
  clearSave(); // NEW

  document.getElementById('setup').classList.remove('hidden');
  document.getElementById('game').classList.add('hidden');

  players=[];
  currentPlayer=0;
  turn=1;
  actionTracker={};
}

// ===== RESET PODIUM =====
function resetPodium(){
  clearSave(); // NEW

  document.getElementById("podium").classList.add("hidden");
  document.getElementById("setup").classList.remove("hidden");

  players = [];
  currentPlayer = 0;
  turn = 1;
  actionTracker = {};

  stocks.forEach(s => {
    s.owned = {};
    s.totalSpent = {};
    s.history = [];
  });
}

// ===== AUTO INIT CONTINUE BUTTON =====
window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("continueBtn");

  if (hasSave()) {
    btn.style.display = "block";

    btn.onclick = () => {
      loadGame();
      document.getElementById("setup").classList.add("hidden");
      document.getElementById("game").classList.remove("hidden");
      render();
    };
  }
});
