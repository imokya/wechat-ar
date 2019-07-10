import * as THREE from '../../libs/vendors/three'
import ARUCO from '../../libs/vendors/aruco/index'

const app = getApp()
let camera, scene, renderer, canvas
let id, torus, markerGroup
let frame, visibleTime = +new Date

Page({

  data: {
  },

  initCamera() {
    const context = wx.createCameraContext()
    const listener = context.onCameraFrame((_frame) => {
      frame = _frame
    })
    listener.start()
  },

  detect() {
    if (!frame) return
    if(+new Date - visibleTime > 500) {
      markerGroup.visible = false
    }
    const data = new Uint8Array(frame.data)
    const detector = new ARUCO.AR.Detector()
    const markers = detector.detect({
      width: frame.width,
      height: frame.height,
      data
    })
    markers.forEach(marker=> {
      switch(marker.id) {
        case 1001:
          this.markerToObject3D(marker, markerGroup, frame)
          visibleTime = +new Date
          markerGroup.visible = true
          break
      }
    })
  },

  markerToObject3D(marker, object3d, frame) {
    const corners = []
    const modelSize = 55.0
    for (let i = 0; i < marker.corners.length; ++i){
      corners.push({
        x : marker.corners[i].x - (frame.width / 2),
        y : (frame.height / 2) - marker.corners[i].y,
      })
    }

    const posit = new ARUCO.POS.Posit(modelSize, frame.width)
    const pose = posit.pose(corners)
    if( pose === null ) return

    const rotation = pose.bestRotation
    const translation = pose.bestTranslation
    
    object3d.scale.x = modelSize
    object3d.scale.y = modelSize
    object3d.scale.z = modelSize
  
    object3d.rotation.x = -Math.asin(-rotation[1][2])
    object3d.rotation.y = -Math.atan2(rotation[0][2], rotation[2][2])
    object3d.rotation.z =  Math.atan2(rotation[1][0], rotation[1][1])
  
    object3d.position.x =  translation[0]
    object3d.position.y =  translation[1]
    object3d.position.z = -translation[2]

  },

  initScene() {
    const w = wx.getSystemInfoSync().windowWidth
    const h = wx.getSystemInfoSync().windowHeight
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000)
    camera.position.z = 5
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false
    })
    renderer.setSize(w, h)
    markerGroup = new THREE.Group()
    const TorusGeo = new THREE.TorusKnotGeometry(0.3, 0.1, 64, 16)
    const TorusMat = new THREE.MeshNormalMaterial()
    torus = new THREE.Mesh(TorusGeo, TorusMat)
    markerGroup.add(torus)
    scene.add(markerGroup)

    const cubeGeo = new THREE.CubeGeometry(1, 1, 1)
    const cubeMat = new THREE.MeshNormalMaterial({
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    })
    const cube = new THREE.Mesh(cubeGeo, cubeMat)
    markerGroup.add(cube)
    markerGroup.visible = false
    this.render()
  },

  render() {
    this.detect()
    torus.rotation.y += 0.03
		torus.rotation.z += 0.03
    renderer.render(scene, camera)
    id = canvas.requestAnimationFrame(this.render.bind(this))
  },

  initCanvas() {
    const query = wx.createSelectorQuery()
    query.select('#mycanvas').node().exec((res) => {
      canvas = res[0].node
      this.initScene()
    })
  },
  onLoad() {
    wx.setNavigationBarTitle({
      title: '小程序AR测试'
    })
    this.initCamera()
    this.initCanvas()
  },
  onUnload() {
    canvas.cancelAnimationFrame(id)
  }
})
