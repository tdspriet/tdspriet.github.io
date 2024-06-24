import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import {
    OutlinePass, RenderPass,
    UnrealBloomPass
} from "three/addons";
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x40495a);
scene.rotation.y = - Math.PI / 2;

// CAMERAS
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.setZ(20);
camera.position.setY(2.5);

let textCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
textCamera.position.setZ(20);
textCamera.position.setY(2.5);
textCamera.layers.set(1);

// RENDERER
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

// COMPOSER
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// OUTLINE PASS
const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
composer.addPass(outlinePass);

// BLOOM PASS
composer.addPass(new UnrealBloomPass(undefined, 1, 1, 0.5));

// RAYCASTER
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let INTERSECTED;

// MODEL
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

/*
// TEXT
function createTextMesh(text, translate) {
    const textGeometry = new TextGeometry(text, {
        font: font,
        size: 1,
        height: 0.25,
    });
    textGeometry.center()
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.translateY(10);
    textMesh.translateZ(translate)
    textMesh.rotation.y = Math.PI / 2;
    scene.add(textMesh);
}

// LOAD FONT
let font;
const fontLoader = new FontLoader();
fontLoader.load('fonts/helvetiker_regular.typeface.json', function (loadedFont) {
    console.log(loadedFont)
    font = loadedFont;
    createTextMesh( "PORTFOLIO", 11);
    createTextMesh( "ABOUT ME", 0);
    createTextMesh( "EDUCATION", -11);
});
console.log(font)
 */

// ANIMATION
let targetCameraPosition = new THREE.Vector3(
    0,
    2.5,
    20
)
var clockwise = false;
function animate() {
    requestAnimationFrame(animate);

    // Update raycaster
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

    if (targetCameraPosition.x === 0 &&
        targetCameraPosition.y === 2.5 &&
        targetCameraPosition.z === 20) {

        camera.position.lerp(targetCameraPosition, 0.05);

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
    } else if (targetCameraPosition) {
        camera.position.lerp(targetCameraPosition, 0.05);
        scene.rotation.y = THREE.MathUtils.lerp(scene.rotation.y, - Math.PI / 2, 0.05);
    }

    composer.render();
}

// RESIZE
window.addEventListener('resize', function () {
    // Update camera
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Update composer
    composer.setSize(window.innerWidth, window.innerHeight);
    outlinePass.setSize(window.innerWidth, window.innerHeight);
});

// HIGHLIGHTER
window.addEventListener('pointermove', function (event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// CLICK EVENT
window.addEventListener('click', function (event) {
    if (INTERSECTED) {
        const box = new THREE.Box3().setFromObject(INTERSECTED);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = new THREE.Vector3();
        box.getSize(size);

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const cameraZ = Math.abs(maxDim / 2 * Math.tan(fov * 2));
        targetCameraPosition = new THREE.Vector3(
            center.x,
            center.y,
            center.z + cameraZ + 5
        );
    }
});

window.addEventListener(('keydown'), (event) => {
    if (event.key === "Escape") {
        targetCameraPosition = new THREE.Vector3(
            0,
            2.5,
            20
        )
    }
});

animate();
