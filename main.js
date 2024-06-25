import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import {
    FontLoader,
    OutlinePass, RenderPass, TextGeometry,
    UnrealBloomPass
} from "three/addons";

/* Scenes, camera, renderer and composer */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x40495a);
scene.rotation.y = - Math.PI / 2; // Rotate to put scene in position

let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.setZ(20);
camera.position.setY(2.5);

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
composer.addPass(outlinePass);
composer.addPass(new UnrealBloomPass(undefined, 1, 1.5, 0.5));


/* Raycaster */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let INTERSECTED;


/* 3D model loader */
const modelloader = new GLTFLoader();
modelloader.load('models/scene.gltf', function (gltf) {
    gltf.scene.traverse(function (node) {
        if (node.isMesh) {
            node.geometry.computeBoundingBox();
        }
    });
    scene.add(gltf.scene);
}, undefined, function (error) {
    console.error(error);
});


/* Text loader*/
function createTextMesh(text, translate) {
    const textGeometry = new TextGeometry(text, {
        font: font,
        size: 1,
        depth: 0.05,
    });
    textGeometry.center()
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff});
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.translateY(10);
    textMesh.translateZ(translate)
    textMesh.rotation.y = Math.PI / 2;
    scene.add(textMesh);
}
let font;
const fontLoader = new FontLoader();
fontLoader.load('fonts/Crang_Regular.json', function (loadedFont) {
    font = loadedFont;
    createTextMesh( "PORTFOLIO", 11);
    createTextMesh( "ABOUT ME", 0);
    createTextMesh( "EDUCATION", -11);
});



/* Animation */
let targetObject = null;
var clockwise = false;
function animate() {
    requestAnimationFrame(animate);

    // Camera and scene
    if (targetObject == null) {
        // Default position
        camera.position.lerp(new THREE.Vector3(
            0,
            2.5,
            20
        ), 0.05);
        // Scene rotation
        if (scene.rotation.y > - Math.PI / 3) {
            clockwise = false;
        }
        if (scene.rotation.y < - 2 * Math.PI / 3) {
            clockwise = true;
        }
        if (clockwise) {
            scene.rotation.y += 0.0005;
        } else {
            scene.rotation.y -= 0.0005;
        }
    } else {
        // Target position
        const box = new THREE.Box3().setFromObject(targetObject);
        const center = new THREE.Vector3(); box.getCenter(center);
        const size = new THREE.Vector3(); box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const cameraZ = Math.abs(maxDim / 2 * Math.tan(fov * 2));
        camera.position.lerp(new THREE.Vector3(
            center.x,
            center.y - 0.25,
            center.z + cameraZ + 4.5
        ), 0.05);
        // Stop scene rotation
        scene.rotation.y = THREE.MathUtils.lerp(scene.rotation.y, - Math.PI / 2, 0.05);
    }

    // Outlining robots
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
        if(intersects[0].object.name === "OmegaXD_OmegaXD_0"
            || intersects[0].object.name === "AlphaUWU_AlphaUWU_0"
            || intersects[0].object.name === "Cube009_Blue_0") {
            INTERSECTED = intersects[0].object;
            outlinePass.selectedObjects = [INTERSECTED];
        }
    } else {
        outlinePass.selectedObjects = [];
        INTERSECTED = null;
    }

    composer.render();
}


/* Resizing */
window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    outlinePass.setSize(window.innerWidth, window.innerHeight);
    updateBloomStrength();
});


/* Mouse tracker */
window.addEventListener('pointermove', function (event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
});


/* Mouse click tracker */
const audio = new Audio('audio/song.mp3');
audio.volume = 0;
audio.loop = true;
window.addEventListener('click', function () {
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0 &&
        (intersects[0].object.name === "OmegaXD_OmegaXD_0"
            || intersects[0].object.name === "AlphaUWU_AlphaUWU_0"
            || intersects[0].object.name === "Cube009_Blue_0")) {
        targetObject = intersects[0].object;

        audio.play();
        let fadeAudio = setInterval(function () {
            if (audio.volume < 0.1) {
                audio.volume += 0.001;
            }
            else {
                clearInterval(fadeAudio);
            }
        }, 20);
    } else {
        targetObject = null;
    }
});

/* Bloom strength adjuster */
function calculateBloomStrength() {
    // Adjust these values as needed
    const baseResolution = 1536 * 730;
    const baseStrength = 1;
    const currentResolution = window.innerWidth * window.innerHeight;
    return baseStrength * baseResolution / currentResolution;
}
function updateBloomStrength() {
    const bloomPass = composer.passes.find(pass => pass instanceof UnrealBloomPass);
    if (bloomPass) {
        bloomPass.strength = calculateBloomStrength();
    }
}

/* Main */
updateBloomStrength();
animate();
