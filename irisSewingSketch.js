import p5 from 'p5'
import init from 'p5.js-svg'

init(p5)

/**
 * Scan replica — “snake” embroidery model (saved approach)
 * ---------------------------------------------------------------------------
 * THREAD ORDER: One continuous vertex chain per bobbin/thread color where the
 * physical thread stays continuous (machine-friendly ordering).
 *
 * FACE vs BACK:
 * - On the *face* (decorative side), you only see stitches laid on top of the
 *   fabric. “Jumps” / travel between separated regions are worked on the *wrong*
 *   side (or trimmed) — so they are NOT drawn in face view.
 * - *Back* view draws the full snake including those travel segments, matching the
 *   single cut-path you’d export for planning or underside reference.
 *
 * Toggle with key `V` (face ↔ back). Export SVG with `S`.
 *
 * Stair / horizontal zigzag fringe blocks from the source scan are omitted — they
 * are decorative scan noise, not part of the flower geometry.
 *
 * Strokes use `STITCH_DASH_PIXELS` (running-stitch dash/gap) via canvas `setLineDash` → SVG.
 *
 * Viewport: square canvas with a circular clip (inscribed circle). Art coordinates
 * assume width `CANVAS_SIZE` and height `LAYOUT_HEIGHT`, centered vertically in the square.
 *
 * Background: `VIEWPORT_OUTSIDE_RGB` fills the square corners; `BACKGROUND_RGB` fills only
 * the circular “hoop” area where the embroidery sits.
 */


/** Square SVG/canvas edge (px). The visible drawing area is a circle of diameter `CANVAS_SIZE`. */
const CANVAS_SIZE = 800

/** Logical height of the stitch layout (px), used to center it vertically in the square. */
const LAYOUT_HEIGHT = 580

/**
 * Thread colors as RGB triples [r, g, b] — dark purple, lighter purple, yellow, green.
 * Matches the reference scan palette.
 */
const THREAD_COLORS = {
	darkPurple: [62, 48, 118],
	midPurple: [88, 68, 150],
	yellow: [218, 186, 48],
	green: [48, 108, 62],
}

/**
 * [dashLengthPx, gapLengthPx] for `setLineDash` — running-stitch appearance on screen/SVG.
 */
const STITCH_DASH_PIXELS = [5, 4]

/** Fabric / paper inside the circular viewport (warm cream). */
const BACKGROUND_RGB = [250, 247, 235]

/** Square canvas area outside the circle (corners of the viewBox / page margin look). */
const VIEWPORT_OUTSIDE_RGB = [30, 32, 40]

/** Stroke weight (px) for dark purple continuous paths. */
const STROKE_WEIGHT_PURPLE_DARK = 1.75

/** Stroke weight (px) for mid purple (center mass) paths. */
const STROKE_WEIGHT_PURPLE_MID = 1.65

/** Stroke weight (px) for right-cluster purple paths. */
const STROKE_WEIGHT_PURPLE_RIGHT = 1.7

/** Stroke weight (px) for yellow accent loops. */
const STROKE_WEIGHT_YELLOW = 1.35

/** Slightly thinner stroke for smallest yellow loop. */
const STROKE_WEIGHT_YELLOW_SMALL = 1.3

/** Stroke weight (px) for green connector / stem. */
const STROKE_WEIGHT_GREEN = 1.45

/** Slightly thinner green stem continuation. */
const STROKE_WEIGHT_GREEN_STEM = 1.4

/**
 * @typedef {{ x: number, y: number }} Point2D
 * One vertex in a polyline (logical stitch path).
 */

/**
 * @typedef {{
 *   fullSnake: Point2D[],
 *   faceVisibleRuns: Point2D[][]
 * }} EmbroideryThreadPath
 *
 * fullSnake — entire continuous path for one thread color (includes underside jumps).
 * faceVisibleRuns — polylines visible on the decorative face only (jumps omitted between runs).
 */

new p5((p) => {
	/**
	 * Current rendering mode: which side of the fabric we visualize.
	 * - 'face' — draw only `faceVisibleRuns` (no jump/travel segments).
	 * - 'back' — draw `fullSnake` as one polyline per thread path.
	 */
	let fabricViewMode = 'face'

	/**
	 * One-time canvas + style setup for SVG output.
	 */
	p.setup = () => {
		p.createCanvas(CANVAS_SIZE, CANVAS_SIZE, p.SVG)
		p.noFill()
		p.strokeCap(p.ROUND)
		p.strokeJoin(p.ROUND)
	}

	/**
	 * Samples an elliptical arc with slight radius wobble so outlines feel hand-drawn / organic.
	 *
	 * @param {number} centerX — ellipse center X
	 * @param {number} centerY — ellipse center Y
	 * @param {number} radiusX — base horizontal radius
	 * @param {number} radiusY — base vertical radius
	 * @param {number} rotationRad — whole ellipse rotation (radians)
	 * @param {number} startAngleRad — arc start (radians)
	 * @param {number} endAngleRad — arc end (radians)
	 * @param {number} vertexCount — number of segments (vertexCount+1 points)
	 * @returns {Point2D[]}
	 */
	function sampleWobblyEllipseArc(
		centerX,
		centerY,
		radiusX,
		radiusY,
		rotationRad,
		startAngleRad,
		endAngleRad,
		vertexCount
	) {
		const points = []
		for (let stepIndex = 0; stepIndex <= vertexCount; stepIndex++) {
			const interpolation = stepIndex / vertexCount
			const angle = startAngleRad + (endAngleRad - startAngleRad) * interpolation
			// Low-frequency wobble on radius so the loop is not a perfect ellipse.
			const radiusScale =
				1 + 0.07 * p.sin(angle * 4) + 0.04 * p.sin(angle * 7)
			const x = centerX + radiusX * radiusScale * p.cos(angle + rotationRad)
			const y = centerY + radiusY * radiusScale * p.sin(angle + rotationRad)
			points.push({ x, y })
		}
		return points
	}

	/**
	 * Concatenates polylines end-to-end; drops duplicate point when the end of A equals start of B.
	 * Used to stitch arc samples into one continuous snake without doubled vertices.
	 *
	 * @param {...Point2D[][]} polylines
	 * @returns {Point2D[]}
	 */
	function mergePolylines(...polylines) {
		const merged = []
		for (const segment of polylines) {
			if (!segment || segment.length === 0) continue
			if (merged.length > 0 && segment.length > 0) {
				const lastMerged = merged[merged.length - 1]
				const firstNew = segment[0]
				// Avoid double vertex when a segment starts exactly where the previous ended.
				if (lastMerged.x === firstNew.x && lastMerged.y === firstNew.y) {
					merged.push(...segment.slice(1))
					continue
				}
			}
			merged.push(...segment)
		}
		return merged
	}

	/**
	 * Two-point segment representing travel/jump between visible runs (underside or trim).
	 *
	 * @param {Point2D} pointA
	 * @param {Point2D} pointB
	 * @returns {[Point2D, Point2D]}
	 */
	function jumpTwoPoints(pointA, pointB) {
		return [pointA, pointB]
	}

	/**
	 * Renders one polyline with thread color, stroke weight, optional CLOSED shape, and stitch dashes.
	 *
	 * @param {Point2D[]} vertices
	 * @param {number[]} strokeRgb — [r, g, b]
	 * @param {number} strokeWeightPx
	 * @param {boolean} closeShape — true → `endShape(CLOSE)` for loops
	 */
	function renderStitchedPolyline(vertices, strokeRgb, strokeWeightPx, closeShape = false) {
		if (vertices.length < 2) return
		p.stroke(...strokeRgb)
		p.strokeWeight(strokeWeightPx)
		p.drawingContext.setLineDash(STITCH_DASH_PIXELS)
		p.beginShape()
		for (const vertex of vertices) p.vertex(vertex.x, vertex.y)
		if (closeShape) p.endShape(p.CLOSE)
		else p.endShape()
	}

	/**
	 * Draws one logical thread path according to `fabricViewMode`.
	 *
	 * @param {EmbroideryThreadPath} threadPath
	 * @param {number[]} strokeRgb
	 * @param {number} strokeWeightPx
	 * @param {boolean|boolean[]} closeFaceRun — per-`faceVisibleRuns` entry, or one bool for all runs
	 */
	function renderEmbroideryThread(threadPath, strokeRgb, strokeWeightPx, closeFaceRun = false) {
		// Underside / planning: single open polyline including jumps between islands.
		if (fabricViewMode === 'back') {
			renderStitchedPolyline(threadPath.fullSnake, strokeRgb, strokeWeightPx, false)
			return
		}
		// Decorative side: draw each visible run separately so jumps never appear.
		const closeFlags = Array.isArray(closeFaceRun)
			? closeFaceRun
			: threadPath.faceVisibleRuns.map(() => closeFaceRun)
		threadPath.faceVisibleRuns.forEach((run, runIndex) => {
			if (run.length < 2) return
			renderStitchedPolyline(run, strokeRgb, strokeWeightPx, closeFlags[runIndex] === true)
		})
	}

	/**
	 * Dark purple: left iris cluster — single continuous outline (no jumps in this color here).
	 *
	 * @returns {EmbroideryThreadPath}
	 */
	function buildThreadPathPurpleLeftCluster() {
		// Upper / outer fall petal edge.
		const outerFallArc = sampleWobblyEllipseArc(208, 218, 72, 58, -0.35, p.PI * 0.15, p.PI * 1.85, 26)
		// Lower lobe continuing the left flower outline.
		const lowerLobeArc = sampleWobblyEllipseArc(175, 255, 48, 40, 0.2, p.PI * 1.9, p.PI * 2.85, 14)
		const joinToLower = jumpTwoPoints(outerFallArc[outerFallArc.length - 1], lowerLobeArc[0])
		// Tight inward curve linking lobes.
		const bridgeArc = sampleWobblyEllipseArc(228, 248, 38, 32, -0.5, p.PI * 2.8, p.PI * 3.45, 12)
		const joinToBridge = jumpTwoPoints(lowerLobeArc[lowerLobeArc.length - 1], bridgeArc[0])
		// Bottom tail of the cluster (points toward center composition).
		const tailArc = sampleWobblyEllipseArc(245, 285, 28, 22, 0.1, p.PI * 3.5, p.PI * 4.2, 10)
		const joinToTail = jumpTwoPoints(bridgeArc[bridgeArc.length - 1], tailArc[0])
		// `slice(1)` skips duplicated joint vertices already present at segment ends.
		const leftClusterOutline = mergePolylines(
			outerFallArc,
			joinToLower.slice(1),
			lowerLobeArc,
			joinToBridge.slice(1),
			bridgeArc,
			joinToTail.slice(1),
			tailArc
		)
		return { fullSnake: leftClusterOutline, faceVisibleRuns: [leftClusterOutline] }
	}

	/**
	 * Mid purple: center iris mass plus right satellite — one thread with a jump between face runs.
	 * fullSnake = center outline → jump → right lobe; face shows center and right as separate runs.
	 *
	 * @returns {EmbroideryThreadPath}
	 */
	function buildThreadPathPurpleCenterAndRight() {
		// Dominant enclosing arc of the middle iris.
		const centerMainArc = sampleWobblyEllipseArc(
			398,
			305,
			112,
			128,
			0.08,
			-0.28 * p.PI,
			1.72 * p.PI,
			42
		)
		// Inward curl on the left side of the center mass.
		const leftHookArc = sampleWobblyEllipseArc(322, 352, 50, 62, -0.35, 0.08 * p.PI, 0.92 * p.PI, 15)
		// Upper “standard” petal edge on the right-upper quadrant.
		const upperLipArc = sampleWobblyEllipseArc(458, 272, 42, 34, 0.55, 0.88 * p.PI, 1.62 * p.PI, 13)
		// Lower heavy curve closing the bottom of the center outline.
		const lowerBulgeArc = sampleWobblyEllipseArc(408, 388, 86, 52, 0.04, 1.52 * p.PI, 2.22 * p.PI, 16)
		// Single continuous outline of the large middle flower before traveling to the right cluster.
		const centerClusterOutline = mergePolylines(centerMainArc, leftHookArc, upperLipArc, lowerBulgeArc)
		// Separate small flower to the right; connected only by a jump in fullSnake.
		const rightSatelliteArc = sampleWobblyEllipseArc(616, 272, 54, 68, -0.12, 0.12 * p.PI, 1.78 * p.PI, 23)
		const jumpToSatellite = jumpTwoPoints(
			centerClusterOutline[centerClusterOutline.length - 1],
			rightSatelliteArc[0]
		)
		const fullSnakeWithJump = mergePolylines(
			centerClusterOutline,
			jumpToSatellite.slice(1),
			rightSatelliteArc
		)
		return {
			fullSnake: fullSnakeWithJump,
			faceVisibleRuns: [centerClusterOutline, rightSatelliteArc],
		}
	}

	/**
	 * Dark purple: isolated right-hand iris outline (third bobbin run in reference layout).
	 *
	 * @returns {EmbroideryThreadPath}
	 */
	function buildThreadPathPurpleFarRight() {
		const farRightOutline = sampleWobblyEllipseArc(
			628,
			302,
			62,
			74,
			-0.2,
			0.1 * p.PI,
			1.9 * p.PI,
			24
		)
		return { fullSnake: farRightOutline, faceVisibleRuns: [farRightOutline] }
	}

	/**
	 * Yellow highlight loop inside the left purple cluster (closed path).
	 *
	 * @returns {EmbroideryThreadPath}
	 */
	function buildThreadPathYellowLeftInner() {
		const innerLoop = sampleWobblyEllipseArc(198, 232, 28, 22, 0.2, 0, p.TWO_PI, 20)
		return { fullSnake: innerLoop, faceVisibleRuns: [innerLoop] }
	}

	/**
	 * Yellow scribble inside the center flower — two arcs merged into one open stroke.
	 *
	 * @returns {EmbroideryThreadPath}
	 */
	function buildThreadPathYellowCenterInner() {
		const upperAccentArc = sampleWobblyEllipseArc(
			382,
			298,
			36,
			44,
			0.1,
			0.25 * p.PI,
			1.35 * p.PI,
			14
		)
		const lowerAccentArc = sampleWobblyEllipseArc(
			418,
			338,
			22,
			30,
			-0.3,
			1.4 * p.PI,
			2.45 * p.PI,
			12
		)
		const centerYellowStroke = mergePolylines(upperAccentArc, lowerAccentArc)
		return { fullSnake: centerYellowStroke, faceVisibleRuns: [centerYellowStroke] }
	}

	/**
	 * Smallest yellow loop nested in the right purple area (closed path).
	 *
	 * @returns {EmbroideryThreadPath}
	 */
	function buildThreadPathYellowRightInner() {
		const smallInnerLoop = sampleWobblyEllipseArc(612, 308, 24, 32, 0.4, 0, p.TWO_PI, 18)
		return { fullSnake: smallInnerLoop, faceVisibleRuns: [smallInnerLoop] }
	}

	/**
	 * Green thread: diagonal connector from left mass toward center (visible on face).
	 *
	 * @returns {EmbroideryThreadPath}
	 */
	function buildThreadPathGreenConnector() {
		const connectorPolyline = [
			{ x: 268, y: 268 },
			{ x: 292, y: 252 },
			{ x: 318, y: 242 },
			{ x: 348, y: 278 },
			{ x: 362, y: 302 },
		]
		return { fullSnake: connectorPolyline, faceVisibleRuns: [connectorPolyline] }
	}

	/**
	 * Green thread: vertical stem dropping from mid composition (second green run).
	 *
	 * @returns {EmbroideryThreadPath}
	 */
	function buildThreadPathGreenStem() {
		const stemPolyline = [
			{ x: 398, y: 418 },
			{ x: 392, y: 455 },
			{ x: 385, y: 498 },
			{ x: 378, y: 532 },
		]
		return { fullSnake: stemPolyline, faceVisibleRuns: [stemPolyline] }
	}

	/**
	 * Paints outer square, circular fabric fill, then every thread path in design order.
	 */
	p.draw = () => {
		const ctx = p.drawingContext
		const half = CANVAS_SIZE / 2
		ctx.save()

		// Full square: color for everything that is not inside the circle.
		p.noStroke()
		p.fill(...VIEWPORT_OUTSIDE_RGB)
		p.rect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

		// Inscribed circle: clip so only this disk gets the fabric tone and stitches.
		ctx.beginPath()
		ctx.arc(half, half, half, 0, p.TWO_PI)
		ctx.clip()

		p.fill(...BACKGROUND_RGB)
		p.circle(half, half, CANVAS_SIZE)
		p.noFill()

		// Center the original 800×580 layout vertically inside the square.
		p.push()
		p.translate(0, (CANVAS_SIZE - LAYOUT_HEIGHT) / 2)

		// Outer purple structure: left cluster, then center+right (mid tone), then far-right lobe.
		renderEmbroideryThread(
			buildThreadPathPurpleLeftCluster(),
			THREAD_COLORS.darkPurple,
			STROKE_WEIGHT_PURPLE_DARK
		)
		renderEmbroideryThread(
			buildThreadPathPurpleCenterAndRight(),
			THREAD_COLORS.midPurple,
			STROKE_WEIGHT_PURPLE_MID
		)
		renderEmbroideryThread(
			buildThreadPathPurpleFarRight(),
			THREAD_COLORS.darkPurple,
			STROKE_WEIGHT_PURPLE_RIGHT
		)

		// Yellow accents: closed loops except the center pair (open stroke).
		renderEmbroideryThread(
			buildThreadPathYellowLeftInner(),
			THREAD_COLORS.yellow,
			STROKE_WEIGHT_YELLOW,
			[true]
		)
		renderEmbroideryThread(
			buildThreadPathYellowCenterInner(),
			THREAD_COLORS.yellow,
			STROKE_WEIGHT_YELLOW,
			[false]
		)
		renderEmbroideryThread(
			buildThreadPathYellowRightInner(),
			THREAD_COLORS.yellow,
			STROKE_WEIGHT_YELLOW_SMALL,
			[true]
		)

		// Green connector + stem (always fullSnake === face run here).
		renderEmbroideryThread(
			buildThreadPathGreenConnector(),
			THREAD_COLORS.green,
			STROKE_WEIGHT_GREEN
		)
		renderEmbroideryThread(
			buildThreadPathGreenStem(),
			THREAD_COLORS.green,
			STROKE_WEIGHT_GREEN_STEM
		)

		p.pop()

		ctx.restore()
		p.noLoop()
	}

	/**
	 * S — save SVG; V — toggle fabric face/back; R — resume draw loop if needed.
	 */
	p.keyPressed = () => {
		const keyChar = p.key
		if (keyChar === 's' || keyChar === 'S') {
			p.save('scan-snake-' + p.millis() + '.svg')
		}
		if (keyChar === 'v' || keyChar === 'V') {
			fabricViewMode = fabricViewMode === 'face' ? 'back' : 'face'
			p.redraw()
		}
		if (keyChar === 'r' || keyChar === 'R') {
			p.loop()
		}
	}
})
