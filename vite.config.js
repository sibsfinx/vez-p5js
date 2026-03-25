import { defineConfig } from 'vite'

export default defineConfig({
	optimizeDeps: {
		include: ['p5', 'p5.js-svg'],
	},
})
