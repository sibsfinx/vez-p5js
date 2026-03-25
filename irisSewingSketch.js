// iris sewing sketch — ellipses, dashed outlines, gravity-arranged petals
import p5 from 'p5'
import init from 'p5.js-svg'
init(p5)

new p5((p) => {
	p.setup = () => {
		p.createCanvas(800, 580, p.SVG)
		p.noFill()
		p.strokeCap(p.ROUND)
		p.strokeJoin(p.ROUND)
	}

	function j(n) { return n + p.random(-5, 5) }

	// one iris flower built from ellipses — all outlines, dashed
	function iris(cx, cy, sz) {
		let ctx = p.drawingContext

		// falls — wide petals that hang down by gravity
		p.stroke(75, 58, 148)
		p.strokeWeight(1.8)
		ctx.setLineDash([6, 5])
		for (let i = 0; i < 3; i++) {
			let a = p.PI/6 + i * p.TWO_PI / 3
			p.push()
			p.translate(j(cx + p.cos(a) * sz * 0.32), j(cy + p.sin(a) * sz * 0.32 + sz * 0.06))
			p.rotate(a + p.HALF_PI)
			p.ellipse(0, 0, j(sz * 0.52), j(sz * 1.05))
			p.pop()
		}

		// standards — narrower petals reaching up against gravity
		p.stroke(110, 75, 168)
		p.strokeWeight(1.5)
		ctx.setLineDash([5, 5])
		for (let i = 0; i < 3; i++) {
			let a = -p.HALF_PI + i * p.TWO_PI / 3
			p.push()
			p.translate(j(cx + p.cos(a) * sz * 0.22), j(cy + p.sin(a) * sz * 0.28 - sz * 0.05))
			p.rotate(a + p.HALF_PI)
			p.ellipse(0, 0, j(sz * 0.28), j(sz * 0.82))
			p.pop()
		}

		// yellow beard — small ellipses at base of each fall
		p.stroke(200, 172, 42)
		p.strokeWeight(1.3)
		ctx.setLineDash([4, 5])
		for (let i = 0; i < 3; i++) {
			let a = p.PI/6 + i * p.TWO_PI / 3
			p.push()
			p.translate(j(cx + p.cos(a) * sz * 0.14), j(cy + p.sin(a) * sz * 0.14))
			p.rotate(a + p.HALF_PI)
			p.ellipse(0, 0, j(sz * 0.14), j(sz * 0.36))
			p.pop()
		}

		// center circle
		ctx.setLineDash([3, 4])
		p.ellipse(j(cx), j(cy), j(sz * 0.16), j(sz * 0.16))

		ctx.setLineDash([])
	}

	// leaf — one ellipse stretched between two points
	function leaf(x1, y1, x2, y2, w) {
		let ctx = p.drawingContext
		p.stroke(42, 92, 52)
		p.strokeWeight(1.4)
		ctx.setLineDash([7, 5])
		let angle = p.atan2(y2 - y1, x2 - x1)
		let d = p.dist(x1, y1, x2, y2)
		p.push()
		p.translate(j((x1+x2)/2), j((y1+y2)/2))
		p.rotate(angle)
		p.ellipse(0, 0, j(w), j(d))
		p.pop()
		ctx.setLineDash([])
	}

	p.draw = () => {
		p.background(250, 247, 235)

		// leaves behind flowers
		leaf(185, 430, 165, 235, 26)
		leaf(180, 490, 225, 348, 20)
		leaf(318, 510, 310, 388, 16)

		// three flowers — diagonal, left heavy
		iris(195, 220, 148)
		iris(332, 285, 122)
		iris(438, 205, 98)

		p.noLoop()
	}

	p.keyPressed = () => {
		if (p.key === 's' || p.key === 'S') p.save('iris-sew-' + p.millis() + '.svg')
		if (p.key === 'r' || p.key === 'R') p.loop()
	}
})
