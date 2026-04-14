let t = 0;
let seaweeds = []; // 建立一個用來儲存水草資料的陣列
let bubbles = []; // 建立一個用來儲存水泡資料的陣列
let stones = []; // 建立石頭陣列
let fishes = []; // 建立魚群陣列
let crabs = []; // 建立螃蟹陣列
const colors = ['#2A4D14', '#317B22', '#67E0A3', '#7CF0BD', '#AFF9C9']; // 可選用的顏色

function setup() {
  // 移除 body 預設邊距並隱藏卷軸，確保完全滿版
  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';
  document.body.style.backgroundColor = 'transparent'; // 確保背景透明，不遮擋

  // 產生 iframe 網頁，並填滿視窗 (底層)
  let myIframe = createElement('iframe');
  myIframe.attribute('src', 'https://www.et.tku.edu.tw/');
  myIframe.style('width', '100vw');
  myIframe.style('height', '100vh');
  myIframe.style('position', 'absolute');
  myIframe.style('top', '0');
  myIframe.style('left', '0');
  myIframe.style('border', 'none');
  myIframe.style('z-index', '0');
  myIframe.style('background', 'transparent');
  myIframe.style('opacity', '1');

  // 建立全螢幕畫布 (上層透明)
  let cvs = createCanvas(windowWidth, windowHeight);
  cvs.style('position', 'absolute');
  cvs.style('top', '0');
  cvs.style('left', '0');
  cvs.style('z-index', '1');       // 畫布置於 iframe 之上
  cvs.style('pointer-events', 'none'); // 讓滑鼠事件穿透畫布，操作底下 iframe
  cvs.style('background', 'transparent');
  cvs.elt.style.background = 'transparent';

  noFill(); // 只要線條，不需要填滿
  generateSeaweeds(); // 初始化產生水草
  generateBubbles(); // 初始化產生水泡
  generateStones(); // 初始化產生石頭
  generateFishes(); // 初始化產生魚群
  generateCrabs(); // 初始化產生螃蟹
}

function generateStones() {
  stones = [];
  let numStones = width / 40; // 根據螢幕寬度決定石頭數量
  for (let i = 0; i < numStones; i++) {
    stones.push({
      x: random(width),
      y: height - random(0, 20),
      w: random(60, 150),
      h: random(30, 80),
      c: color(random(80, 120), random(80, 120), random(80, 120)) // 各種深淺不一的岩石灰
    });
  }
}

function generateFishes() {
  fishes = [];
  for (let i = 0; i < 15; i++) {
    let isClown = random() > 0.6; // 40% 的機率是小丑魚
    fishes.push({
      x: random(width),
      y: random(height * 0.1, height * 0.7),
      s: random(0.5, 2.5) * (random() > 0.5 ? 1 : -1), // 隨機速度與左右方向
      size: random(20, 50),
      isClown: isClown,
      c: isClown ? color(255, 127, 80) : color(random(100, 255), random(100, 255), random(100, 255)), // 小丑魚固定橘色，其他隨機
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

function generateBubbles() {
  bubbles = [];
  // 產生 50 個水泡
  for (let i = 0; i < 50; i++) {
    bubbles.push({
      x: random(width),
      y: random(height),
      r: random(3, 12), // 水泡半徑落於 3~12 之間
      speed: random(0.5, 2.5), // 隨機的上升速度
      noiseOffset: random(1000) // 用於左右飄移的雜訊偏移值
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
  // 清除畫布背景，保持完全透明，讓 iframe 網頁可見
  clear();
  noFill(); // 確保畫水草時不會填滿 (因為下面會畫填滿的水泡)

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
  
  // 繪製及更新石頭、魚、螃蟹、水泡
  drawStones();
  drawFishes();
  drawCrabs();

  // 繪製水泡
  noStroke();
  fill(255, 255, 255, 120); // 半透明的白色
  for (let i = 0; i < bubbles.length; i++) {
    let b = bubbles[i];
    
    // 讓水泡隨 noise 產生微小的左右飄移
    let xOffset = map(noise(b.noiseOffset, t * 2), 0, 1, -1.5, 1.5);
    b.x += xOffset;
    b.y -= b.speed;
    
    circle(b.x, b.y, b.r * 2);
    
    // 當水泡飄出畫面頂端時，讓它從底部重新出現
    if (b.y < -b.r) {
      b.y = height + b.r;
      b.x = random(width);
    }
  }
  
  // 增加時間推進的速度，控制水草搖晃的頻率 (數值越小，搖晃越慢越優雅)
  t += 0.005; 
}

function drawStones() {
  for (let i = 0; i < stones.length; i++) {
    let s = stones[i];
    noStroke();
    fill(red(s.c), green(s.c), blue(s.c), 230);
    ellipse(s.x, s.y, s.w, s.h);
  }
}

function drawFishes() {
  for (let i = 0; i < fishes.length; i++) {
    let f = fishes[i];

    f.x += f.s;
    if (f.x < -f.size) f.x = width + f.size;
    if (f.x > width + f.size) f.x = -f.size;

    push();
    translate(f.x, f.y);
    scale(f.s > 0 ? 1 : -1, 1);
    noStroke();
    fill(f.c);
    ellipse(0, 0, f.size * 1.5, f.size * 0.75);
    fill(255);
    ellipse(f.size * 0.25, -f.size * 0.1, f.size * 0.2, f.size * 0.2);
    fill(0);
    ellipse(f.size * 0.25, -f.size * 0.1, f.size * 0.08, f.size * 0.08);
    pop();
  }
}

function drawCrabs() {
  for (let i = 0; i < crabs.length; i++) {
    let c = crabs[i];
    let wobble = sin(t * 2 + c.offset) * 3;
    let x = c.x;
    let y = height - 10;

    noStroke();
    fill(255, 100, 80, 220);
    ellipse(x, y - 8 + wobble, c.size * 1.1, c.size * 0.7);
    fill(200, 60, 50, 240);
    ellipse(x - c.size * 0.4, y - 10 + wobble, c.size * 0.6, c.size * 0.4);
    ellipse(x + c.size * 0.4, y - 10 + wobble, c.size * 0.6, c.size * 0.4);

    stroke(255, 120, 100);
    strokeWeight(3);
    line(x - c.size * 0.35, y - 10 + wobble, x - c.size * 0.45, y - 20 + wobble);
    line(x + c.size * 0.35, y - 10 + wobble, x + c.size * 0.45, y - 20 + wobble);
    noStroke();
  }
}

// 確保視窗縮放時，畫布能保持全螢幕
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  generateSeaweeds(); // 視窗縮放時重新產生水草以適應新畫面的寬度
  generateBubbles(); // 視窗縮放時重新產生水泡
  generateStones(); // 重新產生石頭
  generateFishes(); // 重新產生魚群
  generateCrabs(); // 重新產生螃蟹
}
