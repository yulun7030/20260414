let particles = [];
let planetAngle = 0;
let comets = [];

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
  canvas.style('z-index', '-1');
  
  for (let i = 0; i < 80; i++) {
    particles.push(new Particle());
  }
}

function draw() {
  // 高級漸層底色
  setGradient(0, 0, width, height, color(26, 42, 76), color(253, 250, 243));
  
  // 1. 右上角旋轉星球
  drawPlanet();

  // 2. 隨機彩虹流星
  if (random(100) < 0.6) comets.push(new Comet());
  for (let i = comets.length - 1; i >= 0; i--) {
    comets[i].update();
    comets[i].display();
    if (comets[i].isOffScreen()) comets.splice(i, 1);
  }

  // 3. 互動星塵粒子
  for (let p of particles) {
    p.update(mouseX, mouseY);
    p.display();
  }

  // 4. 掃描線特效
  drawScanner();
}

function drawPlanet() {
  push();
  translate(width * 0.85, height * 0.2);
  rotate(planetAngle);
  noFill();
  let colors = [color(110, 211, 207, 120), color(92, 124, 153, 120), color(253, 250, 243, 180)];
  for (let i = 0; i < 3; i++) {
    stroke(colors[i]);
    ellipse(0, 0, 160 - i * 40, 160 - i * 40);
    fill(colors[i]);
    ellipse(80 - i * 20, 0, 12, 12);
    noFill();
  }
  planetAngle += 0.005;
  pop();
}

function drawScanner() {
  let scanY = map(sin(frameCount * 0.015), -1, 1, 0, height);
  stroke(255, 255, 255, 40);
  line(0, scanY, width, scanY);
}

function setGradient(x, y, w, h, c1, c2) {
  for (let i = y; i <= y + h; i++) {
    let inter = map(i, y, y + h, 0, 1);
    let c = lerpColor(c1, c2, inter);
    stroke(c);
    line(x, i, x + w, i);
  }
}

class Particle {
  constructor() {
    this.baseX = random(width);
    this.baseY = random(height);
    this.x = this.baseX;
    this.y = this.baseY;
    this.size = random(2, 5);
    this.speedY = random(-0.3, -0.9);
    this.opacity = random(100, 255);
  }
  update(mX, mY) {
    this.baseY += this.speedY;
    if (this.baseY < -10) this.baseY = height + 10;
    let d = dist(this.baseX, this.baseY, mX, mY);
    if (d < 150) {
      let angle = atan2(this.baseY - mY, this.baseX - mX);
      let push = map(d, 0, 150, 40, 0);
      this.x = this.baseX + cos(angle) * push;
      this.y = this.baseY + sin(angle) * push;
    } else {
      this.x = this.baseX; this.y = this.baseY;
    }
  }
  display() {
    noStroke();
    fill(253, 250, 243, this.opacity);
    ellipse(this.x, this.y, this.size);
  }
}

class Comet {
  constructor() {
    this.x = random(width / 2, width * 1.5);
    this.y = -100;
    this.speedX = -random(6, 12);
    this.speedY = random(4, 8);
    this.colors = [color(255, 180, 180), color(180, 255, 240), color(255, 250, 200)];
  }
  update() { this.x += this.speedX; this.y += this.speedY; }
  display() {
    push();
    translate(this.x, this.y);
    for (let i = 0; i < 3; i++) {
      stroke(this.colors[i]);
      line(0, i * 5, 150, -75 + i * 5);
    }
    pop();
  }
  isOffScreen() { return this.x < -200 || this.y > height + 200; }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }