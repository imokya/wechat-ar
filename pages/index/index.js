const THREE = require('../../libs/three')
const THREEAR  = require('../../libs/THREEAR')

let w, h
let canvas, frame
let scene, camera, renderer
let cube, torus, markerGroup
let controller
const RATIO = 0.5625
const CANVAS_WIDTH = 480, CANVAS_HEIGHT = 640
const FRAME_H = CANVAS_WIDTH / RATIO | 0

Page({

  _initScene() {
    scene = new THREE.Scene()
    camera = new THREE.Camera()
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      canvas
    })
    renderer.setSize(CANVAS_WIDTH, FRAME_H)

    markerGroup = new THREE.Group()
    scene.add(markerGroup)

    const torusGeo = new THREE.TorusKnotGeometry(0.3, 0.1, 64, 16)
    const torusMat = new THREE.MeshNormalMaterial()
    torus = new THREE.Mesh(torusGeo, torusMat)
    torus.position.y = 0.5
    markerGroup.add(torus)

    const cubeGeo = new THREE.CubeGeometry(1, 1, 1)
    const cubeMat = new THREE.MeshNormalMaterial({
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    })
    cube = new THREE.Mesh(cubeGeo, cubeMat)
    cube.position.y = 0.5
    markerGroup.add(cube)

    const source = new THREEAR.Source({
      renderer, camera
    })
    THREEAR.initialize({
      source,
      width: CANVAS_WIDTH,
      height: FRAME_H
    }).then((_controller) => {
      const patternMarker = new THREEAR.PatternMarker({
        patternUrl: 'https://www.xingway.com/ar/data/patt.hiro',
        markerObject: markerGroup
      })
      _controller.trackMarker(patternMarker)
      controller = _controller
      this._render()
    })
  },

  _initCamera() {
    const context = wx.createCameraContext()
    const listener = context.onCameraFrame((_frame) => {
      if (!frame) {
        this._initScene()
        //this._log(_frame.width + ': ' + _frame.height)
      }
      frame = _frame
    })
    listener.start()
  },

  _render() {
    
    const data = new Uint8Array(frame.data)
    //const rawData = this._buildData(data)
    controller.update(data)
    torus.rotation.y += 0.01
    torus.rotation.z += 0.01
    renderer.render(scene, camera)
    canvas.requestAnimationFrame(this._render.bind(this))
  },

  _buildData(data) {
    const num = (FRAME_H - CANVAS_HEIGHT) * 4
    const arr = new Uint8Array(num)
    return new Uint8Array([...data, ...arr])
  },

  _init() {
    const query = wx.createSelectorQuery()
    query.select('#canvas').node().exec((res) => {
      canvas = res[0].node
      this._initCamera()
    })
  },

  _resize() {
    const info = wx.getSystemInfoSync()
    w = info.windowWidth
    h = info.windowHeight
    // this.setData({
    //   cameraStyle: `width:${w}px;height:${w/RATIO|0}px;`,
    //   webglStyle: `width:${w}px;height:${w/0.75|0}px;`
    // })
    // console.log(this.data)
  },

  _log(msg) {
    wx.showModal({
      title: '提示',
      content: msg
    })
  },

  onLoad() {
    this._resize()
    this._init()
  }

})
