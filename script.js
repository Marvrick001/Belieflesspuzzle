const puzzle = document.getElementById("puzzle");
const timerEl = document.getElementById("timer");
const scoreEl = document.getElementById("score");

const rows = 4;
const cols = 3;
const totalTiles = rows * cols;
let emptyPos = 0;
let tiles = [];
let draggedTile = null;
let score = 0;
let timeLeft = 300;
let timerInterval;
let gameOver = false;

const images = ["images/beliefless.jpg", "images/beliefless2.png", "images/beliefless3.jpg", "images/beliefless4.jpg", "images/beliefless5.jpg", "images/beliefless6.jpg", "images/beliefless7.jpg", "images/beliefless8.jpg","images/beliefless9.jpg", "images/beliefless10.jpg","images/beliefless11.jpg"];
const image = images[Math.floor(Math.random() * images.length)];
 // Set preview image
 const preview = document.getElementById("preview-image");
 preview.style.backgroundImage = `url(${image})`;
function createTiles() {
  puzzle.innerHTML = "";
  tiles = [];
  for (let i = 0; i < totalTiles; i++) {
    const tile = document.createElement("div");
    tile.dataset.position = i;
    if (i === emptyPos) {
      tile.className = "tile empty";
    } else {
      tile.className = "tile";
      const x = i % cols;
      const y = Math.floor(i / cols);
      tile.style.backgroundImage = `url(${image})`;
      tile.style.backgroundPosition = `-${x * 100}px -${y * 100}px`;
      tile.draggable = true;
    }
    tiles.push(tile);
  }
  shuffleTiles();
}

function shuffleTiles() {
  do {
    tiles.sort(() => Math.random() - 0.5);
    emptyPos = tiles.findIndex(t => t.classList.contains("empty"));
  } while (!isSolvable());
  renderTiles();
}

function isSolvable() {
  const arr = tiles.map(t => t.classList.contains("empty") ? 0 : parseInt(t.dataset.position)+1);
  let inv = 0;
  for(let i=0;i<arr.length;i++){
    for(let j=i+1;j<arr.length;j++){
      if(arr[i] && arr[j] && arr[i] > arr[j]) inv++;
    }
  }
  return inv % 2 === 0;
}

function renderTiles() {
  puzzle.innerHTML = "";
  tiles.forEach(tile => puzzle.appendChild(tile));
}

function isAdjacent(index1, index2) {
  const x1 = index1 % cols;
  const y1 = Math.floor(index1 / cols);
  const x2 = index2 % cols;
  const y2 = Math.floor(index2 / cols);
  return (Math.abs(x1 - x2) === 1 && y1 === y2) || (Math.abs(y1 - y2) === 1 && x1 === x2);
}

puzzle.addEventListener("click", e => {
  if (!e.target.classList.contains("tile") || e.target.classList.contains("empty")) return;

  const index = tiles.indexOf(e.target);
  if (isAdjacent(index, emptyPos)) {
    [tiles[index], tiles[emptyPos]] = [tiles[emptyPos], tiles[index]];
    emptyPos = index;
    renderTiles();
    checkWin();
  }
});

puzzle.addEventListener("dragstart", e => { draggedTile = e.target; });
puzzle.addEventListener("dragover", e => e.preventDefault());
puzzle.addEventListener("drop", e => {
  const targetIndex = tiles.indexOf(draggedTile);
  if (isAdjacent(targetIndex, emptyPos)) {
    [tiles[targetIndex], tiles[emptyPos]] = [tiles[emptyPos], tiles[targetIndex]];
    emptyPos = targetIndex;
    renderTiles();
    checkWin();
  }
});

async function checkWin() {
  const correct = tiles.every((tile,index) =>
    tile.classList.contains("empty") ? index === 0 : parseInt(tile.dataset.position) === index
  );

  if (correct) {
    clearInterval(timerInterval);
    gameOver = true;
    score += 10; // points for winning
    scoreEl.innerText = `Score: ${score}`;

    const username = "Player"; // later: Telegram username
    await saveScore(username, score);
    loadLeaderboard();
  }
}
function startTimer() {
  timerEl.innerText = `TIME 05:00`;
  timerInterval = setInterval(()=>{
    if(gameOver) return;
    timeLeft--;
    const min = String(Math.floor(timeLeft/60)).padStart(2,'0');
    const sec = String(timeLeft%60).padStart(2,'0');
    timerEl.innerText = `TIME ${min}:${sec}`;
    if(timeLeft<=0){
      clearInterval(timerInterval);
      gameOver = true;
      showLeaderboard();
    }
  },1000);
}

document.getElementById("restart-btn").onclick = ()=>{ 
  document.getElementById("leaderboard-overlay").classList.add("hidden"); 
  resetGame(); 
};
document.getElementById("quit-btn").onclick = ()=>{ window.location.reload(); };

function resetGame(){
  score = 0;
  timeLeft = 300;
  gameOver = false;
  scoreEl.innerText = `Score: ${score}`;
  startTimer();
  createTiles();
}

createTiles();
startTimer();
import { collection, addDoc, query, orderBy, limit, getDocs } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const leaderboardRef = collection(window.db, "leaderboard");

// Save score
async function saveScore(username, score) {
  try {
    await addDoc(leaderboardRef, {
      name: username,
      score: score,
      createdAt: Date.now()
    });
    console.log("Score saved successfully");
  } catch (error) {
    console.error("Error saving score:", error);
  }
}

// Load leaderboard
async function loadLeaderboard() {
  try {
    const q = query(leaderboardRef, orderBy("score", "desc"), limit(10));
    const snapshot = await getDocs(q);
    const list = document.getElementById("leaderboard-list");
    list.innerHTML = "";

    snapshot.forEach((doc, index) => {
      const data = doc.data();
      const li = document.createElement("li");
      li.innerHTML = `<span>${index + 1}. ${data.name}</span><span>${data.score}</span>`;
      list.appendChild(li);
    });

    document.getElementById("leaderboard-overlay").classList.remove("hidden");
    console.log("Leaderboard loaded successfully");
  } catch (error) {
    console.error("Error loading leaderboard:", error);
  }
}