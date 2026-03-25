void setup() {
  size(400, 400);
  noStroke();
}

void draw() {
  background(20, 24, 32);
  fill(120, 180, 255);
  float r = 40 + 20 * sin(frameCount * 0.05);
  ellipse(width / 2, height / 2, r * 2, r * 2);
}
