import * as THREE from '../../libs/vendors/three'
import * as THREEAR from '../../libs/vendors/THREEAR'

let camera, scene, renderer, canvas
let id, torus, markerGroup
let frame, controller, lastTime = 0
let inited = false
let w, h
let frameSliceIndex

const app = getApp()
const RATIO = 4/3

Page({

  data: {
    canvasStyle: '',
    cameraStyle: ''
  },
  
  initStyles() {
    const info = wx.getSystemInfoSync()
    w = info.windowWidth
    h = w / RATIO | 0
    const style = `width:${w}px;height:${h}px;`
    this.setData({
      canvasStyle: style,
      cameraStyle: style
    })
  },

  initCamera() {
    const info = wx.getSystemInfoSync()
    const context = wx.createCameraContext()
    const listener = context.onCameraFrame((_frame) => {
      frame = _frame
      if (!inited) {
        this.initScene()
        inited = true
      }
    })
    listener.start()
  },

  debug() {
    const info = wx.getSystemInfoSync()
    const tw = info.windowWidth
    const th = info.windowHeight
    const sw = info.screenWidth
    const sh = info.screenHeight

    wx.showModal({
      title: '提示',
      content: `w: ${tw} h: ${th}`
    })
  },

  initScene() {

    const vw = frame.width
    const vh = vw / RATIO | 0

    renderer = new THREE.WebGLRenderer({
      alpha: true,
      canvas,
      antialias: false
    })

    renderer.setSize(w, h)

    scene = new THREE.Scene()
    camera = new THREE.Camera()
    scene.add(camera)

    markerGroup = new THREE.Group()
    scene.add(markerGroup)

    const source = new THREEAR.Source({ 
      renderer, 
      camera
    })

    THREEAR.initialize({ 
      source, 
      canvasWidth: vw,
      canvasHeight: vh
    }).then((_controller) => {
      controller = _controller
      this.initialize(_controller)
      this.render()
    })

    frameSliceIndex = vw * (frame.height - vh) * 4
    
  },

  initialize(controller) {
    const torusGeo = new THREE.TorusKnotGeometry(0.3, 0.1, 64, 16)
    const torusMat = new THREE.MeshNormalMaterial()
    torus = new THREE.Mesh(torusGeo, torusMat)
    torus.position.y = 0.5

    /*
    const axesHelper = new THREE.AxesHelper(5)
    markerGroup.add(axesHelper)
    */

    markerGroup.add(torus)
    const cubeGeo = new THREE.CubeGeometry(1, 1, 1)
    const cubeMat = new THREE.MeshNormalMaterial({
      transparent : true,
      opacity: 0.5,
      side: THREE.DoubleSide
    })
    const cube = new THREE.Mesh(cubeGeo, cubeMat)
    cube.position.y	= cubeGeo.parameters.height / 2
    markerGroup.add(cube)

    const patternMarker = new THREEAR.PatternMarker({
      patternUrl: 'https://www.xingway.com/ar/data/patt.hiro',
      markerObject: markerGroup
    })
    controller.trackMarker(patternMarker)
  },

  render(now) {
    if (frame) {
      lastTime = lastTime || now - 1000 / 60
      const delta = Math.min(200, now - lastTime)
      lastTime = now
      let rawData = new Uint8Array(frame.data)
      rawData = this.sliceData(rawData)
      controller.update(rawData)
      torus.rotation.y += delta / 1000 * Math.PI
      torus.rotation.z += delta / 1000 * Math.PI
      renderer.render(scene, camera)
    }
    id = canvas.requestAnimationFrame(this.render.bind(this))
  },

  sliceData(rawData) {
    return rawData.slice(frameSliceIndex)
  },

  initCanvas() {
    const query = wx.createSelectorQuery()
    query.select('#webgl').node().exec((res) => {
      canvas = res[0].node
      this.initStyles()
      this.initCamera()
    })
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '小程序AR测试'
    })
    this.initCanvas()
  },

  onUnload() {
    canvas.cancelAnimationFrame(id)
  }

})
