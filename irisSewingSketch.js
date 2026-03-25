// iris sewing sketch — stitchy dashed outlines
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

	function r(v) { return v + p.random(-v * 0.08, v * 0.08) }
	function ra() { return p.random(-0.12, 0.12) }

	function petal(cx, cy, w, h, angle) {
		p.push()
		p.translate(r(cx), r(cy))
		p.rotate(angle + ra())
		let ww = r(w)
		let hh = r(h)
		p.beginShape()
		p.curveVertex(0, -hh / 2)
		p.curveVertex(0, -hh / 2)
		p.curveVertex(ww * 0.45, -hh * 0.15)
		p.curveVertex(ww * 0.3, hh * 0.3)
		p.curveVertex(0, hh / 2)
		p.curveVertex(-ww * 0.3, hh * 0.3)
		p.curveVertex(-ww * 0.45, -hh * 0.15)
		p.curveVertex(0, -hh / 2)
		p.curveVertex(0, -hh / 2)
		p.endShape(p.CLOSE)
		p.pop()
	}

	// longer leaf shape
	function leaf(cx, cy, w, h, angle) {
		p.push()
		p.translate(r(cx), r(cy))
		p.rotate(angle + ra())
		let ww = r(w)
		let hh = r(h)
		p.beginShape()
		p.curveVertex(0, -hh / 2)
		p.curveVertex(0, -hh / 2)
		p.curveVertex(ww * 0.35, -hh * 0.1)
		p.curveVertex(ww * 0.25, hh * 0.35)
		p.curveVertex(0, hh / 2)
		p.curveVertex(-ww * 0.2, hh * 0.3)
		p.curveVertex(-ww * 0.3, -hh * 0.15)
		p.curveVertex(0, -hh / 2)
		p.curveVertex(0, -hh / 2)
		p.endShape(p.CLOSE)
		p.pop()
	}

	p.draw = () => {
		p.background(250, 247, 235)
		let ctx = p.drawingContext

		// -- purple/blue petals --
		p.stroke(75, 60, 145)
		p.strokeWeight(1.8)
		ctx.setLineDash([6, 5])

		// upper left cluster
		petal(195, 115, 90, 55, -0.3)
		petal(145, 135, 70, 45, 0.5)
		petal(250, 105, 65, 40, 0.15)
		petal(115, 105, 55, 35, -0.5)

		// upper right scatter
		petal(340, 100, 75, 50, 0.25)
		petal(400, 115, 55, 35, -0.2)
		petal(435, 130, 50, 30, 0.4)

		// center dense mass
		petal(230, 195, 140, 85, 0.2)
		petal(310, 210, 130, 80, -0.25)
		petal(170, 230, 120, 70, 0.45)
		petal(280, 260, 110, 65, -0.1)
		petal(365, 235, 100, 60, 0.3)
		petal(200, 280, 95, 55, -0.35)

		// lower right trailing
		petal(390, 295, 85, 50, 0.15)
		petal(430, 330, 70, 42, -0.3)
		petal(350, 340, 80, 48, 0.5)

		// bottom petals
		petal(280, 370, 100, 58, -0.2)
		petal(320, 400, 75, 45, 0.35)
		petal(240, 410, 65, 40, -0.45)

		// -- yellow accents --
		p.stroke(205, 175, 45)
		p.strokeWeight(1.5)
		ctx.setLineDash([4, 5])

		petal(210, 130, 35, 45, 0.1)
		petal(310, 120, 28, 35, -0.2)
		petal(250, 230, 30, 40, 0.3)
		petal(340, 260, 25, 32, -0.15)
		petal(290, 355, 30, 38, 0.2)
		petal(365, 380, 22, 30, -0.1)

		// -- green stems/leaves --
		p.stroke(45, 95, 55)
		p.strokeWeight(1.6)
		ctx.setLineDash([7, 5])

		leaf(175, 310, 40, 130, 0.7)
		leaf(210, 380, 35, 120, 0.5)
		leaf(310, 430, 30, 100, 0.3)

		ctx.setLineDash([])
		p.noLoop()
	}

	p.keyPressed = () => {
		if (p.key === 's' || p.key === 'S') {
			p.save('iris-sew-' + p.millis() + '.svg')
		}
		// re-randomize
		if (p.key === 'r' || p.key === 'R') {
			p.loop()
		}
	}
})
