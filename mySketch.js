import p5 from 'p5'
import init from 'p5.js-svg'

// https://github.com/zenozeng/p5.js-svg — use with p5.js 1.x
init(p5)

new p5((p) => {
	p.setup = () => {
		p.createCanvas(500, 500, p.SVG)
		p.background(240)
		p.pixelDensity(20)
	}

	p.draw = () => {
		let a = 400
		p.ellipse(p.width / 2, p.height / 2, a, a)
		p.drawingContext.clip()

		p.strokeWeight(4)
		for (let i = 4; i < 20; i++) {
			for (let j = 4; j < 20; j++) {
				let radius = p.random(400, 390)
				p.ellipse(i * 30, j * 30, radius, radius)
				p.fill(p.random(0, 255), 30, 60)
			}
		}

		p.drawingContext.setLineDash([66, 33])
		p.stroke(255)
		p.beginShape()
		for (let i = 0; i < 80; i++) {
			p.curveVertex(p.random(0, 500), p.random(0, 500))
		}
		p.endShape()

		p.noLoop()
	}

	p.keyPressed = () => {
		if (p.key === 's' || p.key === 'S') {
			let time = p.millis()
			p.save('output' + time + '.svg')
			p.noLoop()
		}
	}
})
