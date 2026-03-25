// Scan replica — one continuous vertex path per connected color group ("snake").
// Purple / yellow / green; zigzag fringes are chained into the same polyline where connected.
import p5 from 'p5'
import init from 'p5.js-svg'
init(p5)

const W = 800
const H = 580

const COL = {
	purple: [62, 48, 118],
	purpleHi: [88, 68, 150],
	yellow: [218, 186, 48],
	green: [48, 108, 62],
}

new p5((p) => {
	p.setup = () => {
		p.createCanvas(W, H, p.SVG)
		p.noFill()
		p.strokeCap(p.ROUND)
		p.strokeJoin(p.ROUND)
	}

	/** Wobbly ellipse as open polyline (first ≠ last). */
	function wobbleArc(cx, cy, rx, ry, rot, startA, endA, n) {
		const pts = []
		for (let i = 0; i <= n; i++) {
			const t = i / n
			const ang = startA + (endA - startA) * t
			const w = 1 + 0.07 * p.sin(ang * 4) + 0.04 * p.sin(ang * 7)
			const x = cx + rx * w * p.cos(ang + rot)
			const y = cy + ry * w * p.sin(ang + rot)
			pts.push({ x, y })
		}
		return pts
	}

	function concat(...parts) {
		const out = []
		for (const arr of parts) {
			if (!arr || !arr.length) continue
			if (out.length && arr.length) {
				const a = out[out.length - 1]
				const b = arr[0]
				if (a.x === b.x && a.y === b.y) {
					out.push(...arr.slice(1))
					continue
				}
			}
			out.push(...arr)
		}
		return out
	}

	function bridge(a, b) {
		return [a, b]
	}

	/** Horizontal fringe: one continuous snake, rows alternate L→R / R→L. */
	function fringeZigzag(xMin, xMax, y0, rows, rowGap, stepX) {
		const pts = []
		for (let r = 0; r < rows; r++) {
			const y = y0 + r * rowGap
			const LTR = r % 2 === 0
			const xStart = LTR ? xMin : xMax
			const xEnd = LTR ? xMax : xMin
			const dir = LTR ? 1 : -1
			if (r > 0) {
				const prevLTR = (r - 1) % 2 === 0
				const xJoin = prevLTR ? xMax : xMin
				pts.push({ x: xJoin, y })
			}
			for (let x = xStart; dir > 0 ? x <= xEnd + 0.1 : x >= xEnd - 0.1; x += dir * stepX) {
				pts.push({ x, y })
			}
		}
		return pts
	}

	function drawSnake(pts, strokeCol, sw, close = false) {
		if (pts.length < 2) return
		p.stroke(...strokeCol)
		p.strokeWeight(sw)
		p.drawingContext.setLineDash([])
		p.beginShape()
		for (const q of pts) p.vertex(q.x, q.y)
		if (close) p.endShape(p.CLOSE)
		else p.endShape()
	}

	// --- Purple snake 1: top-left lobe + top horizontal fringe (one connected path) ---
	function purpleSnake1() {
		const arc1 = wobbleArc(208, 218, 72, 58, -0.35, p.PI * 0.15, p.PI * 1.85, 26)
		const arc2 = wobbleArc(175, 255, 48, 40, 0.2, p.PI * 1.9, p.PI * 2.85, 14)
		const join1 = bridge(arc1[arc1.length - 1], arc2[0])
		const arc3 = wobbleArc(228, 248, 38, 32, -0.5, p.PI * 2.8, p.PI * 3.45, 12)
		const join2 = bridge(arc2[arc2.length - 1], arc3[0])
		const tail = wobbleArc(245, 285, 28, 22, 0.1, p.PI * 3.5, p.PI * 4.2, 10)
		const join3 = bridge(arc3[arc3.length - 1], tail[0])
		const afterLobe = concat(arc1, join1.slice(1), arc2, join2.slice(1), arc3, join3.slice(1), tail)
		const last = afterLobe[afterLobe.length - 1]
		const frStart = { x: 92, y: 118 }
		const toFringe = bridge(last, frStart)
		const fr = fringeZigzag(78, 168, 102, 7, 10, 11)
		return concat(afterLobe, toFringe.slice(1), fr)
	}

	// --- Purple snake 2: central mass + bottom fringe + right satellite (one connected path) ---
	function purpleSnake2() {
		const main = wobbleArc(398, 305, 112, 128, 0.08, -0.28 * p.PI, 1.72 * p.PI, 42)
		const hook = wobbleArc(322, 352, 50, 62, -0.35, 0.08 * p.PI, 0.92 * p.PI, 15)
		const lip = wobbleArc(458, 272, 42, 34, 0.55, 0.88 * p.PI, 1.62 * p.PI, 13)
		const lower = wobbleArc(408, 388, 86, 52, 0.04, 1.52 * p.PI, 2.22 * p.PI, 16)
		const mid = concat(main, hook, lip, lower)
		const last = mid[mid.length - 1]
		const botFr = fringeZigzag(312, 488, 430, 6, 9, 11)
		const sat = wobbleArc(616, 272, 54, 68, -0.12, 0.12 * p.PI, 1.78 * p.PI, 23)
		return concat(mid, bridge(last, botFr[0]).slice(1), botFr, bridge(botFr[botFr.length - 1], sat[0]).slice(1), sat)
	}

	// --- Purple snake 3: isolated right wing + side fringe ---
	function purpleSnake3() {
		const body = wobbleArc(628, 302, 62, 74, -0.2, 0.1 * p.PI, 1.9 * p.PI, 24)
		const last = body[body.length - 1]
		const fr = fringeZigzag(688, 758, 220, 8, 11, 10)
		const toFr = bridge(last, fr[0])
		return concat(body, toFr.slice(1), fr)
	}

	// --- Yellow snakes (each disconnected region = one path) ---
	function yellowSnake1() {
		return wobbleArc(198, 232, 28, 22, 0.2, 0, p.TWO_PI, 20)
	}

	function yellowSnake2() {
		const a = wobbleArc(382, 298, 36, 44, 0.1, 0.25 * p.PI, 1.35 * p.PI, 14)
		const b = wobbleArc(418, 338, 22, 30, -0.3, 1.4 * p.PI, 2.45 * p.PI, 12)
		return concat(a, b)
	}

	function yellowSnake3() {
		return wobbleArc(612, 308, 24, 32, 0.4, 0, p.TWO_PI, 18)
	}

	// --- Green snakes ---
	function greenSnake1() {
		return [
			{ x: 268, y: 268 },
			{ x: 292, y: 252 },
			{ x: 318, y: 242 },
			{ x: 348, y: 278 },
			{ x: 362, y: 302 },
		]
	}

	function greenSnake2() {
		return [
			{ x: 398, y: 418 },
			{ x: 392, y: 455 },
			{ x: 385, y: 498 },
			{ x: 378, y: 532 },
		]
	}

	p.draw = () => {
		p.background(250, 247, 235)

		drawSnake(purpleSnake1(), COL.purple, 1.75)
		drawSnake(purpleSnake2(), COL.purpleHi, 1.65)
		drawSnake(purpleSnake3(), COL.purple, 1.7)

		drawSnake(yellowSnake1(), COL.yellow, 1.35, true)
		drawSnake(yellowSnake2(), COL.yellow, 1.35)
		drawSnake(yellowSnake3(), COL.yellow, 1.3, true)

		drawSnake(greenSnake1(), COL.green, 1.45)
		drawSnake(greenSnake2(), COL.green, 1.4)

		p.noLoop()
	}

	p.keyPressed = () => {
		if (p.key === 's' || p.key === 'S') p.save('scan-snake-' + p.millis() + '.svg')
		if (p.key === 'r' || p.key === 'R') p.loop()
	}
})
