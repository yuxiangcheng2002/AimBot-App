let blocks = [];
const numCircles = 8;
const circleSize = 80;
const attractionRadius = 200;
let cursorPos;
let cursorOffset;
let errorX, errorY;
let idealPos;

function setup() {
  createCanvas(windowWidth, windowHeight);
  cursorPos = createVector(mouseX, mouseY);
  idealPos = createVector(mouseX, mouseY);
  cursorOffset = createVector(0, 0);

  generateBlocks();
}

function generateBlocks() {
  blocks = [];
  let attempts = 0;
  const maxAttempts = 100;
  const minDistance = attractionRadius * 1.2;

  while (blocks.length < numCircles && attempts < maxAttempts) {
    let x = random(circleSize / 2, width - circleSize / 2);
    let y = random(circleSize / 2, height - circleSize / 2);

    let validPosition = true;
    for (let block of blocks) {
      let d = dist(x, y, block.pos.x, block.pos.y);
      if (d < minDistance) {
        validPosition = false;
        break;
      }
    }

    if (validPosition) {
      blocks.push(new Block(x, y));
    }

    attempts++;
  }
}

function draw() {
  background(240);

  cursorPos.x = mouseX;
  cursorPos.y = mouseY;

  let isHoveringAnyBlock = blocks.some((block) =>
    block.isHovering(mouseX, mouseY)
  );

  blocks.forEach((block) => block.display());

  if (isHoveringAnyBlock) {
    idealPos.x = cursorPos.x;
    idealPos.y = cursorPos.y;
  } else {
    let totalForce = createVector(0, 0);
    blocks.forEach((block) => {
      let force = block.calculateAttraction(cursorPos.x, cursorPos.y);
      totalForce.add(force);
    });

    let nearestBlock = null;
    let minDist = Infinity;
    blocks.forEach((block) => {
      let d = dist(cursorPos.x, cursorPos.y, block.pos.x, block.pos.y);
      if (d < minDist) {
        minDist = d;
        nearestBlock = block;
      }
    });

    if (nearestBlock) {
      let toBlock = p5.Vector.sub(nearestBlock.pos, cursorPos);
      let forceDir = totalForce.copy().normalize();
      let forceMag = totalForce.mag();

      idealPos = p5.Vector.add(
        cursorPos,
        forceDir.mult(
          min(
            forceMag,
            dist(
              cursorPos.x,
              cursorPos.y,
              nearestBlock.pos.x,
              nearestBlock.pos.y
            )
          )
        )
      );
    }

    // 在方块之后绘制力线
    let force = p5.Vector.sub(idealPos, cursorPos);
    let forceMag = force.mag() * 3;
    let forceDir = force.copy().normalize().mult(forceMag);

    let steps = 20;
    let baseWidth = 4;

    for (let i = steps; i > 0; i--) {
      let t = i / steps;
      let alpha = map(t, 0, 1, 180, 0);
      let sw = map(t, 0, 1, baseWidth, baseWidth / 2);

      stroke(0, 150, 255, alpha);
      strokeWeight(sw);

      let start = p5.Vector.lerp(
        createVector(cursorPos.x, cursorPos.y),
        createVector(cursorPos.x + forceDir.x, cursorPos.y + forceDir.y),
        (i - 1) / steps
      );
      let end = p5.Vector.lerp(
        createVector(cursorPos.x, cursorPos.y),
        createVector(cursorPos.x + forceDir.x, cursorPos.y + forceDir.y),
        i / steps
      );

      line(start.x, start.y, end.x, end.y);
    }
  }

  // 只保留理想位置的蓝点
  fill(0, 150, 255);
  noStroke();
  ellipse(idealPos.x, idealPos.y, 16, 16);

  // 计算和显示误差与力
  errorX = Math.round(idealPos.x - cursorPos.x);
  errorY = Math.round(idealPos.y - cursorPos.y);

  let forceMagnitude = 0;
  if (!isHoveringAnyBlock) {
    let force = p5.Vector.sub(idealPos, cursorPos);
    forceMagnitude = Math.round(force.mag());
  }

  // 计算响应式文本大小
  let baseFontSize = min(width, height) / 40; // 根据屏幕大小计算基础字体大小

  // 显示文本
  fill(0);
  textSize(baseFontSize);
  textAlign(LEFT, BOTTOM);

  // 计算文本位置，使用相对于屏幕大小的边距
  let margin = baseFontSize;
  let lineHeight = baseFontSize * 1.5;

  // 使用模板字符串让数字右对齐
  text(
    `Force:  ${forceMagnitude.toString().padStart(4, " ")}`,
    margin,
    height - lineHeight * 3
  );
  text(
    `ErrorX: ${errorX.toString().padStart(4, " ")}`,
    margin,
    height - lineHeight * 2
  );
  text(
    `ErrorY: ${errorY.toString().padStart(4, " ")}`,
    margin,
    height - lineHeight
  );
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  generateBlocks();
}

class Block {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.size = circleSize;
  }

  isHovering(x, y) {
    return dist(x, y, this.pos.x, this.pos.y) < this.size / 2;
  }

  calculateAttraction(targetX, targetY) {
    if (this.isHovering(targetX, targetY)) {
      return createVector(0, 0);
    }

    let force = createVector(0, 0);
    let distance = dist(this.pos.x, this.pos.y, targetX, targetY);

    if (distance < attractionRadius) {
      force = p5.Vector.sub(this.pos, createVector(targetX, targetY));

      let strength = map(distance, 0, attractionRadius, 6.0, 0);
      strength = strength * strength * strength * strength;
      force.setMag(strength);
    }

    return force;
  }

  display() {
    push();
    let steps = 20;
    for (let i = steps; i > 0; i--) {
      let radius = attractionRadius * 2 * (i / steps);
      let alpha = map(i, 0, steps, 0, 15);
      fill(255, 20, 147, alpha);
      noStroke();
      circle(this.pos.x, this.pos.y, radius);
    }

    fill(255, 20, 147);
    noStroke();
    circle(this.pos.x, this.pos.y, this.size);
    pop();
  }
}
