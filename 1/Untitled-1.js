let t = 0;
let seaweeds = []; // 建立一個用來儲存水草資料的陣列
let stones = []; // 建立石頭陣列
let fishes = []; // 建立魚群陣列
let crabs = []; // 建立螃蟹陣列
const colors = ['#2A4D14', '#317B22', '#67E0A3', '#7CF0BD', '#AFF9C9']; // 可選用的顏色

function setup() {
  // 移除 body 預設邊距並隱藏卷軸，確保完全滿版
  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';
  document.body.style.backgroundColor = 'transparent'; // 確保背景透明

  // 建立全螢幕畫布
  let cvs = createCanvas(windowWidth, windowHeight);
  cvs.style('position', 'absolute');
  cvs.style('top', '0');
  cvs.style('left', '0');
  cvs.style('z-index', '999');
  cvs.style('pointer-events', 'none'); // 讓滑鼠事件穿透畫布

  // 產生 iframe 網頁
  let myIframe = createElement('iframe');
  myIframe.attribute('src', 'https://p5js.org/'); // 更換為允許被 iframe 嵌入的網址
  myIframe.style('width', '100vw');
  myIframe.style('height', '100vh');
  myIframe.style('position', 'absolute');
  myIframe.style('top', '0');
  myIframe.style('left', '0');
  myIframe.style('border', 'none');
  myIframe.style('z-index', '0'); 

  noFill(); // 只要線條，不需要填滿
  generateSeaweeds(); // 初始化產生水草
  generateStones();
  generateFishes();
  generateCrabs();
}

function generateStones() {
  stones = [];
  let numStones = width / 40;
  for (let i = 0; i < numStones; i++) {
    stones.push({
      x: random(width),
      y: height - random(0, 20),
      w: random(60, 150),
      h: random(30, 80),
      c: color(random(80, 120), random(80, 120), random(80, 120))
    });
  }
}

function generateFishes() {
  fishes = [];
  for (let i = 0; i < 15; i++) {
    let isClown = random() > 0.6;
    fishes.push({
      x: random(width),
      y: random(height * 0.1, height * 0.7),
      s: random(0.5, 2.5) * (random() > 0.5 ? 1 : -1),
      size: random(20, 50),
      isClown: isClown,
      c: isClown ? color(255, 127, 80) : color(random(100, 255), random(100, 255), random(100, 255)),
      offset: random(1000)
    });
  }
}

function generateCrabs() {
  crabs = [];
  for (let i = 0; i < 6; i++) {
    crabs.push({
      x: random(width),
      y: height - random(5, 15),
      size: random(25, 45),
      offset: random(1000)
    });
  }
}

function generateSeaweeds() {
  seaweeds = [];
  // 利用迴圈產生 80 條水草的各項隨機屬性
  for (let i = 0; i < 80; i++) {
    let c = color(random(colors));
    c.setAlpha(178); // 設定 70% 透明度 (255 * 0.7 ≈ 178)

    seaweeds.push({
      x: random(width), // 隨機分佈在視窗左到右
      c: c, // 使用帶有透明度的顏色物件
      w: random(20, 30), // 粗細改細一點，落於 20-30 之間
      h: random(height * 0.2, height * 0.45), // 高度為視窗高度的 20%-45%
      noiseOffset: random(1000) // 隨機偏移值，讓每一條水草搖晃頻率不同步
    });
  }
}

function draw() {
  // 背景顏色
  background('#eef2fd');

  // 逐一畫出陣列中的 80 條水草
  for (let i = 0; i < seaweeds.length; i++) {
    let sw = seaweeds[i];
    strokeWeight(sw.w);
    stroke(sw.c);
    
    beginShape();
    let endY = height - sw.h; // 計算該條水草生長到的最高點 Y 座標
    
    for (let y = height; y > endY; y -= 10) {
      let heightRatio = map(y, height, endY, 0, 1);

      // 加入 sw.noiseOffset 形成 3D Noise 取樣，這樣每條水草的動態才不會重疊一致
      let noiseVal = noise(sw.noiseOffset, y * 0.002, t);

      // 最大搖晃偏移量 (像素)
      let maxOffset = 200 * heightRatio;
      
      let xOffset = map(noiseVal, 0, 1, -maxOffset, maxOffset);
      let x = sw.x + xOffset;

      curveVertex(x, y);
    }
    
    endShape();
  }
  
  // 增加時間推進的速度，控制水草搖晃的頻率 (數值越小，搖晃越慢越優雅)
  t += 0.005; 
}

// 確保視窗縮放時，畫布能保持全螢幕
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  generateSeaweeds(); // 視窗縮放時重新產生水草以適應新畫面的寬度
  generateStones();
  generateFishes();
  generateCrabs();
}
