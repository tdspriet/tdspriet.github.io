import './style.css'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x40495a);
scene.rotation.y = -1.57
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.setZ(20)
camera.position.setY(2.5)
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
    })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.render(scene, camera)

const loader = new GLTFLoader()
loader.load( 'models/scene.gltf', function ( gltf ) {

    scene.add( gltf.scene );

}, undefined, function ( error ) {

    console.error( error );

} );

var clockwise = false
function animate() {
    requestAnimationFrame(animate)

    if(scene.rotation.y > -1) {
        clockwise = false
    }
    if(scene.rotation.y < -2.25) {
        clockwise = true
    }

    if(clockwise) {
        scene.rotation.y += 0.0005
    } else {
        scene.rotation.y -= 0.0005
    }

    renderer.render(scene, camera)
}

animate()