'use client'

import { useEffect, useRef, useState } from 'react'
import { MARK_PATH, MARK_VIEWBOX } from '../brand/mark-path'

/**
 * The Zenith mark as a real-time 3D object: the traced vector extruded into
 * polished chrome with gold edges, lit by four moving lights in the platform
 * colours. three.js is loaded only after the page is idle, rendering pauses
 * off-screen, and the flat mark stays in place when WebGL is unavailable,
 * data-saver is on, or motion is reduced (then a single still frame is drawn).
 */
export function Zenith3D({ className = '' }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = host.current
    if (!el) return
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } }
    if (nav.connection?.saveData) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let disposed = false
    let cleanup = () => {}

    const start = async () => {
      const THREE = await import('three')
      const { SVGLoader } = await import('three/examples/jsm/loaders/SVGLoader.js')
      const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js')
      if (disposed) return

      let renderer: InstanceType<typeof THREE.WebGLRenderer>
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
      } catch {
        return // no WebGL: keep the flat mark
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.05
      renderer.outputColorSpace = THREE.SRGBColorSpace
      const canvas = renderer.domElement
      canvas.setAttribute('aria-hidden', 'true')
      canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%'
      el.appendChild(canvas)

      const scene = new THREE.Scene()
      const pmrem = new THREE.PMREMGenerator(renderer)
      const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
      scene.environment = env

      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50)
      camera.position.set(0, 0, 7)

      // Geometry from the same vector the 2D logos use.
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_VIEWBOX}"><path d="${MARK_PATH}" fill="#fff" fill-rule="evenodd"/></svg>`
      const shapes = new SVGLoader().parse(svg).paths.flatMap((p) => SVGLoader.createShapes(p))
      const geo = new THREE.ExtrudeGeometry(shapes, { depth: 110, bevelEnabled: true, bevelThickness: 22, bevelSize: 12, bevelSegments: 5, curveSegments: 10 })
      geo.center()
      geo.scale(1 / 520, -1 / 520, 1 / 520)
      geo.computeVertexNormals()
      const chrome = new THREE.MeshPhysicalMaterial({ color: 0xe6eaf0, metalness: 1, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.25 })
      const gold = new THREE.MeshPhysicalMaterial({ color: 0xd9b25f, metalness: 1, roughness: 0.24, clearcoat: 0.6, envMapIntensity: 1.1 })
      const mark = new THREE.Mesh(geo, [chrome, gold])

      // Two thin orbit rings: the meridian and the horizon.
      const ringMat = new THREE.MeshStandardMaterial({ color: 0xd9b25f, metalness: 1, roughness: 0.3, emissive: 0x3a2a08, emissiveIntensity: 0.6 })
      const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.0085, 8, 220), ringMat)
      const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.82, 0.005, 8, 220), new THREE.MeshStandardMaterial({ color: 0x9aa3b2, metalness: 1, roughness: 0.4 }))
      ring1.rotation.x = Math.PI * 0.42
      ring2.rotation.x = Math.PI * 0.55
      ring2.rotation.y = 0.35

      const group = new THREE.Group()
      group.add(mark, ring1, ring2)
      scene.add(group)

      // Product-coloured lights orbit the mark and paint moving highlights on the chrome.
      const lights = [0xd9b25f, 0xff5a44, 0x3fd8c0, 0x9d8cff].map((c) => {
        const l = new THREE.PointLight(c, 18, 12, 1.6)
        scene.add(l)
        return l
      })
      scene.add(new THREE.AmbientLight(0xffffff, 0.15))

      const resize = () => {
        const w = el.clientWidth
        const h = el.clientHeight
        if (!w || !h) return
        renderer.setSize(w, h, false)
        camera.aspect = w / h
        camera.position.z = w / h < 0.9 ? 8 : 7
        camera.updateProjectionMatrix()
      }
      resize()
      const ro = new ResizeObserver(resize)
      ro.observe(el)

      const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
      const onMove = (e: PointerEvent) => {
        pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2
        pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2
      }
      window.addEventListener('pointermove', onMove, { passive: true })

      const t0 = performance.now()
      const frame = (now: number) => {
        const t = (now - t0) / 1000
        const intro = reduce ? 1 : 1 - Math.pow(1 - Math.min(1, t / 1.8), 4)
        pointer.x += (pointer.tx - pointer.x) * 0.05
        pointer.y += (pointer.ty - pointer.y) * 0.05
        group.rotation.y = (1 - intro) * -1.6 + Math.sin(t * 0.45) * 0.32 + pointer.x * 0.35
        group.rotation.x = Math.sin(t * 0.35) * 0.06 + pointer.y * 0.18
        group.position.y = Math.sin(t * 0.8) * 0.06
        group.scale.setScalar(0.72 + intro * 0.28)
        ring1.rotation.z = t * 0.25
        ring2.rotation.z = -t * 0.15
        lights.forEach((l, i) => {
          const a = t * 0.6 + (i * Math.PI) / 2
          l.position.set(Math.cos(a) * 3.2, Math.sin(a * 1.3) * 1.8, 2.4 + Math.sin(a) * 0.8)
        })
        renderer.render(scene, camera)
      }

      let raf = 0
      let visible = false
      const loop = (now: number) => {
        frame(now)
        raf = visible ? requestAnimationFrame(loop) : 0
      }
      const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting && !document.hidden
        if (reduce) return
        if (visible && !raf) raf = requestAnimationFrame(loop)
      })
      io.observe(el)
      const onVis = () => {
        visible = !document.hidden && el.getBoundingClientRect().bottom > 0
        if (visible && !raf && !reduce) raf = requestAnimationFrame(loop)
      }
      document.addEventListener('visibilitychange', onVis)

      frame(t0 + 4000) // a settled first frame
      setReady(true)

      cleanup = () => {
        cancelAnimationFrame(raf)
        io.disconnect()
        ro.disconnect()
        window.removeEventListener('pointermove', onMove)
        document.removeEventListener('visibilitychange', onVis)
        geo.dispose()
        chrome.dispose()
        gold.dispose()
        ringMat.dispose()
        env.dispose()
        pmrem.dispose()
        renderer.dispose()
        canvas.remove()
      }
    }

    const hasIdle = 'requestIdleCallback' in window
    const handle = hasIdle ? window.requestIdleCallback(() => void start(), { timeout: 1200 }) : window.setTimeout(() => void start(), 300)
    return () => {
      disposed = true
      if (hasIdle) window.cancelIdleCallback(handle)
      else clearTimeout(handle)
      cleanup()
    }
  }, [])

  return (
    <div ref={host} className={`relative ${className}`}>
      {/* The flat mark: shown until the 3D one is ready, and kept when it can't be. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset, sized by CSS */}
      <img
        src="/brand/zenith-mark-512.webp"
        alt=""
        aria-hidden
        className="absolute left-1/2 top-1/2 w-[46%] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_20px_60px_rgba(217,178,95,0.25)] transition-opacity duration-700"
        style={{ opacity: ready ? 0 : 1 }}
      />
    </div>
  )
}
