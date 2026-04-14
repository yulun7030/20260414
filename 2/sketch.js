let topPoints = [];
let bottomPoints = [];
let numPoints = 10; // 改為 10 個點
let gameState = 0; // 狀態機：0=準備中, 1=遊戲進行中, 2=失敗, 3=成功
let startZoneWidth = 40; // 開始區域的寬度
let level = 1; // 記錄過關次數（難度等級）
let catImg; // 宣告用來存放小貓圖片的變數
let sparks = []; // 存放火花粒子的陣列
let zapOsc; // 觸電音效合成器
let confetti = []; // 存放紙花粒子的陣列
let winOsc; // 過關音效合成器
let lives = 3; // 生命值
let invincibilityTimer = 0; // 無敵時間計時器
let catFood = { x: 0, y: 0, active: false }; // 貓罐頭道具
let buffTimer = 0; // 縮小效果計時器
let bgImg; // 宣告用來存放背景圖片的變數

function preload() {
  // 載入小貓圖片 (這裡提供一個免費圖標的線上網址作為範例)
  // 如果你有自己的圖片，可以改成檔名，例如 loadImage('cat.png');
  catImg = loadImage('https://cdn-icons-png.flaticon.com/512/616/616430.png');
  // 載入背景圖片，並加入成功與失敗的處理，防止 CORS 問題導致遊戲卡住
  bgImg = loadImage('房子.png', 
    () => console.log('背景圖片載入成功'), 
    () => { console.log('背景圖片載入失敗'); bgImg = null; });
}

function setup() {
  // 改為全螢幕
  createCanvas(windowWidth, windowHeight);
  
  // 初始化觸電音效 (使用鋸齒波 sawtooth 產生類似電流的聲音)
  zapOsc = new p5.Oscillator('sawtooth');
  winOsc = new p5.Oscillator('triangle'); // 初始化過關音效 (使用三角波)
  
  // 禁用瀏覽器預設的右鍵選單，避免點擊右鍵時干擾遊戲體驗
  document.oncontextmenu = function() { return false; };
  
  generatePath();
}

// 產生 5 個頂點與對應的下方點
function generatePath() {
  // 重置狀態
  buffTimer = 0;
  invincibilityTimer = 0;

  topPoints = [];
  bottomPoints = [];
  let spacing = width / (numPoints - 1); // 讓點均勻分佈在畫布上

  for (let i = 0; i < numPoints; i++) {
    let x = i * spacing;
    let topY = random(50, height - 150); // 配合全螢幕動態產生上方線條高度
    
    // 依要求將通關道路改大，並隨過關次數(level)稍微增加難度
    let minGap = max(80, 150 - level * 5);  // 通道最小寬度
    let maxGap = max(150, 250 - level * 5); // 通道最大寬度
    let gap = random(minGap, maxGap);

    topPoints.push(createVector(x, topY));
    bottomPoints.push(createVector(x, topY + gap));
  }

  // 隨機在路徑中段產生貓罐頭
  let foodX = random(width * 0.3, width * 0.7);
  catFood = {
    x: foodX,
    y: (getCurveY(topPoints, foodX) + getCurveY(bottomPoints, foodX)) / 2, // 放在路徑正中間
    active: true
  };
}

function draw() {
  // 如果背景圖片成功載入則顯示圖片，否則顯示預設背景色以免產生殘影
  if (bgImg) {
    imageMode(CORNER); 
    image(bgImg, 0, 0, width, height); 
  } else {
    background(240); 
  }

  // 繪製上下邊界線條
  stroke(50);
  strokeWeight(2);
  noFill();

  // 依照指令，利用 curveVertex 串接上方的點 (頭尾需重複一次作為控制點)
  beginShape();
  curveVertex(topPoints[0].x, topPoints[0].y);
  for (let i = 0; i < numPoints; i++) {
    curveVertex(topPoints[i].x, topPoints[i].y);
  }
  curveVertex(topPoints[numPoints-1].x, topPoints[numPoints-1].y);
  endShape();

  // 依照指令，利用 curveVertex 串接下方的點
  beginShape();
  curveVertex(bottomPoints[0].x, bottomPoints[0].y);
  for (let i = 0; i < numPoints; i++) {
    curveVertex(bottomPoints[i].x, bottomPoints[i].y);
  }
  curveVertex(bottomPoints[numPoints-1].x, bottomPoints[numPoints-1].y);
  endShape();

  // 繪製開始區域（綠色）與結束判定線（藍色）
  noStroke();
  fill(0, 200, 0, 150); 
  rect(0, topPoints[0].y, startZoneWidth, bottomPoints[0].y - topPoints[0].y);

  fill(0, 0, 200, 150); 
  rect(width - 20, topPoints[numPoints-1].y - 50, 20, bottomPoints[numPoints-1].y - topPoints[numPoints-1].y + 100);

  // 顯示當前等級
  fill(0, 150);
  noStroke();
  textSize(24);
  textAlign(RIGHT, TOP);
  text("Level: " + level, width - 20, 20);

  // 顯示生命值
  textAlign(LEFT, TOP);
  let hearts = "";
  for (let i = 0; i < lives; i++) hearts += "❤️ ";
  text("Lives: " + hearts, 20, 20);

  // 處理不同的遊戲狀態
  if (gameState === 0) {
    fill(0);
    textAlign(LEFT, CENTER);
    textSize(16);
    text("將滑鼠移至綠色區域\n並「按右鍵」開始", 10, topPoints[0].y - 30);
  } 
  else if (gameState === 1) {
    // 計時器遞減
    if (invincibilityTimer > 0) invincibilityTimer--;
    if (buffTimer > 0) buffTimer--;

    // 繪製與處理貓罐頭
    if (catFood.active) {
      textSize(24);
      textAlign(CENTER, CENTER);
      text("🥫", catFood.x, catFood.y);
      
      // 檢查是否吃到罐頭 (給予距離 25 像素的判定範圍)
      if (dist(mouseX, mouseY, catFood.x, catFood.y) < 25) {
        catFood.active = false;
        buffTimer = 180; // 縮小效果持續 3 秒 (以 60FPS 計算)
      }
    }

    // 遊戲進行中：檢查是否碰到邊界或出界
    checkCollision();

    // 畫出代表玩家的小貓圖片
    imageMode(CENTER); // 設定以圖片中心點為基準，確保碰撞判斷的準確性
    let catSize = buffTimer > 0 ? 15 : 30; // 吃到罐頭縮小為 15，否則為 30
    // 無敵時間閃爍效果
    if (invincibilityTimer === 0 || frameCount % 10 < 5) {
      image(catImg, mouseX, mouseY, catSize, catSize);
    }
    imageMode(CORNER); // 畫完後恢復為預設模式，以免影響其他繪圖
  } 
  else if (gameState === 2) {
    fill(255, 0, 0);
    textAlign(CENTER, CENTER);
    textSize(48);
    text("失敗了！", width / 2, height / 2);
    textSize(24);
    text("點擊滑鼠左鍵重新開始 (等級將重置)", width / 2, height / 2 + 50);
  } 
  else if (gameState === 3) {
    // 繪製紙花特效
    for (let i = confetti.length - 1; i >= 0; i--) {
      let p = confetti[i];
      p.vy += 0.2; // 加入輕微重力
      p.x += p.vx;
      p.y += p.vy;
      p.angle += p.spin; // 紙花旋轉
      
      push();
      translate(p.x, p.y);
      rotate(p.angle);
      noStroke();
      fill(p.color);
      rectMode(CENTER);
      rect(0, 0, p.size, p.size);
      pop();
    }

    fill(0, 150, 0);
    textAlign(CENTER, CENTER);
    textSize(48);
    text("恭喜通關！", width / 2, height / 2);
    textSize(24);
    text("點擊滑鼠左鍵進入下一關！", width / 2, height / 2 + 50);
  }

  // 繪製火花特效 (移至狀態判斷外，讓扣血受傷時也能看見短暫火花)
  for (let i = sparks.length - 1; i >= 0; i--) {
    let p = sparks[i];
    p.vy += 0.5;
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 12;
    
    noStroke();
    fill(255, random(150, 255), 0, p.life);
    circle(p.x, p.y, random(3, 8));
    
    if (p.life <= 0) sparks.splice(i, 1);
  }
}

function checkCollision() {
  if (invincibilityTimer > 0) return; // 無敵狀態下不判定碰撞

  // 1. 檢查是否到達最右邊結束點
  if (mouseX >= width - 10) {
    triggerSuccess(); // 觸發成功特效
    return;
  }

  // 2. 檢查是否往左超出邊界 (防作弊機制)
  if (mouseX < 0) {
    triggerHit(); // 改為觸發受傷判定
    return;
  }

  // 3. 利用 p5.js 的曲線公式精算當前的上下邊界 Y 座標
  let currentTopY = getCurveY(topPoints, mouseX);
  let currentBottomY = getCurveY(bottomPoints, mouseX);

  // 加入貓咪的體積判定 (考量吃到罐頭的縮小狀態)
  let catSize = buffTimer > 0 ? 15 : 30;
  let margin = (catSize / 2) - 4; // 給予玩家一點點容錯空間，縮小後此空間會連帶變小

  // 檢查是否碰到上下邊界
  if (mouseY - margin <= currentTopY || mouseY + margin >= currentBottomY) {
    triggerHit(); // 改為觸發受傷判定
  }
}

// 新增：受傷判定邏輯
function triggerHit() {
  lives--; // 扣除一點生命
  
  if (lives <= 0) {
    triggerFail(); // 生命值歸零，觸發失敗
  } else {
    invincibilityTimer = 60; // 給予約 1 秒的無敵時間 (60 frames)
    
    // 播放較短的觸電受傷音效
    zapOsc.start();
    zapOsc.freq(500);
    zapOsc.freq(100, 0.2);
    zapOsc.amp(0.3);
    zapOsc.amp(0, 0.2);
    setTimeout(() => zapOsc.stop(), 200);

    // 產生少量火花
    for (let i = 0; i < 15; i++) {
      sparks.push({
        x: mouseX, y: mouseY,
        vx: random(-6, 6), vy: random(-8, 2),
        life: 255
      });
    }
  }
}

// 新增：觸發失敗狀態並播放特效與音效
function triggerFail() {
  gameState = 2;
  
  // 播放觸電音效 (利用合成器產生高頻瞬間降至低頻的電流短路聲)
  zapOsc.start();
  zapOsc.freq(600);
  zapOsc.freq(50, 0.3); // 0.3秒內頻率急速下降
  zapOsc.amp(0.5);
  zapOsc.amp(0, 0.3);   // 0.3秒內音量漸弱至無
  setTimeout(() => zapOsc.stop(), 300);

  // 產生 30 個火花粒子
  sparks = [];
  for (let i = 0; i < 30; i++) {
    sparks.push({
      x: mouseX, y: mouseY,
      vx: random(-8, 8), vy: random(-10, 2), // 初始給予隨機的爆發力(往上與四散)
      life: 255
    });
  }
}

// 新增：觸發成功狀態並播放特效與音效
function triggerSuccess() {
  gameState = 3;
  
  // 播放過關音效 (利用合成器產生歡樂的琶音效果：A4 -> C#5 -> E5 -> A5)
  winOsc.start();
  winOsc.amp(0.5);
  winOsc.freq(440); // 基礎音 (A4)
  setTimeout(() => winOsc.freq(554.37), 100); // C#5
  setTimeout(() => winOsc.freq(659.25), 200); // E5
  setTimeout(() => winOsc.freq(880), 300);    // A5
  setTimeout(() => { winOsc.amp(0, 0.5); }, 500); // 聲音漸弱
  setTimeout(() => winOsc.stop(), 1000);

  // 產生 100 個紙花粒子
  confetti = [];
  for (let i = 0; i < 100; i++) {
    confetti.push({
      x: mouseX, y: mouseY,
      vx: random(-8, 8), vy: random(-12, -2), // 往上噴發四散
      size: random(5, 12),
      color: color(random(255), random(255), random(255)),
      angle: random(TWO_PI), spin: random(-0.3, 0.3) // 隨機旋轉與自轉速度
    });
  }
}

// 新增：利用二元搜尋與 curvePoint 計算指定 X 對應的曲線 Y 座標
function getCurveY(points, targetX) {
  let segment = -1;
  for (let i = 0; i < numPoints - 1; i++) {
    if (targetX >= points[i].x && targetX <= points[i+1].x) {
      segment = i;
      break;
    }
  }
  if (segment === -1) return points[0].y; // 預防出界

  // 取得曲線的四個控制點 (p0, p1, p2, p3)
  let p0 = segment === 0 ? points[0] : points[segment - 1];
  let p1 = points[segment];
  let p2 = points[segment + 1];
  let p3 = segment === numPoints - 2 ? points[numPoints - 1] : points[segment + 2];

  let tLow = 0;
  let tHigh = 1;
  let tMid = 0.5;
  
  // 二元搜尋找尋正確的 t 值
  for (let i = 0; i < 15; i++) {
    tMid = (tLow + tHigh) / 2;
    let xMid = curvePoint(p0.x, p1.x, p2.x, p3.x, tMid);
    if (xMid < targetX) {
      tLow = tMid;
    } else {
      tHigh = tMid;
    }
  }
  return curvePoint(p0.y, p1.y, p2.y, p3.y, tMid);
}

// 處理滑鼠點擊事件
function mousePressed() {
  if (gameState === 0) {
    // 檢查滑鼠是否在綠色的起點區域內
    let startY = topPoints[0].y;
    let startH = bottomPoints[0].y - topPoints[0].y;

    if (mouseX >= 0 && mouseX <= startZoneWidth && mouseY >= startY && mouseY <= startY + startH) {
      // 確定是按下「右鍵」才開始遊戲
      if (mouseButton === RIGHT) {
        gameState = 1; 
      }
    }
  } else if (gameState === 2) {
    // 失敗則重置等級
    level = 1;
    lives = 3; // 重置生命值
    generatePath();
    gameState = 0;
  } else if (gameState === 3) {
    // 成功過關，等級+1並增加難度
    level++;
    lives = 3; // 過關後補滿生命值
    generatePath();
    gameState = 0;
  }
}

// 支援視窗縮放
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (gameState === 0) {
    generatePath(); // 如果在準備階段縮放視窗，自動重新計算路徑
  }
}
