// iris sewing sketch
import p5 from 'p5'
import init from 'p5.js-svg'

init(p5)

new p5((p) => {
	p.setup = () => {
		p.createCanvas(800, 600, p.SVG)
		p.strokeJoin(p.ROUND)
		p.strokeCap(p.ROUND)
		p.noFill()
	}

	// tiny jitter so each render differs
	function j(v) { return v + p.random(-3, 3) }
	function ja() { return p.random(-0.06, 0.06) }

	// draw a closed curve through an array of [x,y] points
	function shape(pts) {
		p.beginShape()
		// duplicate first and last for curveVertex tangents
		p.curveVertex(j(pts[0][0]), j(pts[0][1]))
		for (let i = 0; i < pts.length; i++) {
			p.curveVertex(j(pts[i][0]), j(pts[i][1]))
		}
		p.curveVertex(j(pts[0][0]), j(pts[0][1]))
		p.curveVertex(j(pts[1][0]), j(pts[1][1]))
		p.endShape(p.CLOSE)
	}

	// rotated shape helper
	function rshape(cx, cy, pts, angle) {
		p.push()
		p.translate(cx, cy)
		p.rotate(angle + ja())
		shape(pts)
		p.pop()
	}

	// petal template — narrow pointed oval, centered at 0,0
	function narrowPetal(cx, cy, w, h, angle) {
		rshape(cx, cy, [
			[0, -h/2],
			[w*0.3, -h*0.25],
			[w*0.45, h*0.05],
			[w*0.25, h*0.35],
			[0, h/2],
			[-w*0.25, h*0.35],
			[-w*0.45, h*0.05],
			[-w*0.3, -h*0.25]
		], angle)
	}

	// wider, rounder petal
	function widePetal(cx, cy, w, h, angle) {
		rshape(cx, cy, [
			[0, -h/2],
			[w*0.4, -h*0.2],
			[w*0.5, h*0.1],
			[w*0.35, h*0.35],
			[0, h/2],
			[-w*0.3, h*0.38],
			[-w*0.48, h*0.05],
			[-w*0.35, -h*0.22]
		], angle)
	}

	// asymmetric / cupped petal
	function cupPetal(cx, cy, w, h, angle) {
		rshape(cx, cy, [
			[0, -h/2],
			[w*0.35, -h*0.3],
			[w*0.5, -h*0.05],
			[w*0.4, h*0.25],
			[w*0.1, h/2],
			[-w*0.2, h*0.4],
			[-w*0.45, h*0.1],
			[-w*0.3, -h*0.2]
		], angle)
	}

	// thin elongated leaf
	function leafShape(cx, cy, w, h, angle) {
		rshape(cx, cy, [
			[0, -h/2],
			[w*0.25, -h*0.2],
			[w*0.3, h*0.15],
			[w*0.15, h*0.4],
			[0, h/2],
			[-w*0.12, h*0.38],
			[-w*0.25, h*0.1],
			[-w*0.2, -h*0.25]
		], angle)
	}

	p.draw = () => {
		p.background(250, 247, 235)
		let ctx = p.drawingContext

		// ===== BLUE / INDIGO PETALS =====
		p.stroke(75, 58, 148)
		p.strokeWeight(1.7)
		ctx.setLineDash([6, 5])

		// -- top row: small scattered petals fanning left --
		narrowPetal(100, 128, 55, 32, -0.7)
		narrowPetal(118, 108, 48, 28, -0.4)
		cupPetal(155, 100, 72, 38, -0.15)
		narrowPetal(215, 92, 80, 38, -0.05)

		// -- top row: extending right --
		widePetal(280, 88, 68, 36, 0.1)
		narrowPetal(340, 92, 58, 30, 0.2)
		narrowPetal(395, 105, 52, 28, 0.15)
		narrowPetal(432, 120, 46, 26, 0.35)

		// -- second row: medium overlapping --
		widePetal(140, 148, 95, 52, 0.4)
		cupPetal(220, 145, 85, 48, -0.15)
		narrowPetal(130, 165, 80, 42, 0.6)
		widePetal(290, 152, 78, 42, 0.1)

		// -- center: big dense mass --
		widePetal(225, 205, 145, 82, 0.15)
		cupPetal(320, 215, 135, 78, -0.2)
		widePetal(170, 235, 125, 72, 0.4)
		cupPetal(275, 262, 118, 68, -0.05)
		narrowPetal(370, 240, 105, 58, 0.25)
		widePetal(195, 285, 100, 55, -0.3)

		// -- right side trailing --
		cupPetal(400, 290, 88, 50, 0.1)
		narrowPetal(440, 335, 72, 40, -0.25)

		// -- lower cluster --
		widePetal(350, 345, 82, 50, 0.45)
		cupPetal(285, 372, 105, 60, -0.15)
		narrowPetal(325, 405, 78, 44, 0.3)
		narrowPetal(245, 415, 68, 38, -0.4)

		// ===== YELLOW ACCENTS =====
		p.stroke(200, 172, 42)
		p.strokeWeight(1.4)
		ctx.setLineDash([4, 5])

		narrowPetal(205, 108, 32, 44, 0.05)
		narrowPetal(305, 105, 26, 34, -0.15)
		cupPetal(242, 225, 30, 42, 0.25)
		narrowPetal(340, 258, 26, 34, -0.1)
		narrowPetal(290, 360, 28, 38, 0.15)
		cupPetal(355, 388, 24, 32, -0.2)

		// ===== GREEN STEMS / LEAVES =====
		p.stroke(42, 92, 52)
		p.strokeWeight(1.5)
		ctx.setLineDash([7, 5])

		leafShape(168, 305, 38, 135, 0.65)
		leafShape(205, 385, 32, 120, 0.45)
		leafShape(305, 435, 28, 100, 0.25)

		ctx.setLineDash([])
		p.noLoop()
	}

	p.keyPressed = () => {
		if (p.key === 's' || p.key === 'S') {
			p.save('iris-sew-' + p.millis() + '.svg')
		}
		if (p.key === 'r' || p.key === 'R') {
			p.loop()
		}
	}
})
