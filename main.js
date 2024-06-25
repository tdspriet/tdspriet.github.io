import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import {
    FontLoader,
    OutlinePass, RenderPass, TextGeometry,
    UnrealBloomPass
} from "three/addons";
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

/* Scenes, camera, renderer and composer */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x40495a);
scene.rotation.y = - Math.PI / 2; // Rotate to put scene in position

let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.setZ(20);
camera.position.setY(50);

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera)); // Default render
const vignettePass = new ShaderPass(VignetteShader);
vignettePass.uniforms["darkness"].value = 1.1;
composer.addPass(vignettePass); // Vignitte render
const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
composer.addPass(outlinePass); // Outline render
composer.addPass(new UnrealBloomPass(undefined, 1, 1.5, 0.5)); // Bloom render

let started = false; // Hold scene until user press enter
function startScene() {
    started = true;
    updateBloomStrength();
    animate();
    audio.play();
    let fadeAudio = setInterval(function () {
        if (audio.volume < 0.1) {
            audio.volume += 0.01;
        }
        else {
            clearInterval(fadeAudio);
        }
    }, 20);
    const nav = document.querySelector('nav');
    nav.style.display = 'block';
    setTimeout(() => {
        nav.classList.add('visible');
    }, 0);
}


/* Text maker and font loader */
function createTextMesh(text, translateX=0, translateY=0, translateZ=0) {
    const textGeometry = new TextGeometry(text, {
        font: font,
        size: 1,
        depth: 0.05,
    });
    textGeometry.center()
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff});
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.translateX(translateX);
    textMesh.translateY(translateY);
    textMesh.translateZ(translateZ);
    textMesh.rotation.y = Math.PI / 2;
    scene.add(textMesh);
}

let font;
const fontLoader = new FontLoader();
fontLoader.load('fonts/crang.json', function (loadedFont) {
    font = loadedFont;
    createTextMesh("Press Enter to start", 0, 50, 0);
    composer.render()
    createTextMesh( "PORTFOLIO", 0, 10, 11);
    createTextMesh( "ABOUT ME", 0, 10, 0);
    createTextMesh( "EDUCATION", 0, 10, -11);
});


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


/* Animation */
let targetObject = null;
var clockwise = false;
function animate() {
    if(!started) {
        return;
    }
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
    composer.render()
    updateBloomStrength();
});


/* Mouse tracker */
window.addEventListener('pointermove', function (event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
});


/* Mouse click tracker */
/* TODO:
    When double-clicking a mech you zoomed in on, it will turn away from the mech and translate you inside the mech
    from there a new scene ("/education" for example) will be displayed with the mech's interior and information
*/
window.addEventListener('click', function () {
    if(!started) {
        startScene();
        return;
    }
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0 &&
        (intersects[0].object.name === "OmegaXD_OmegaXD_0"
            || intersects[0].object.name === "AlphaUWU_AlphaUWU_0"
            || intersects[0].object.name === "Cube009_Blue_0")) {
        targetObject = intersects[0].object;
    } else {
        targetObject = null;
    }
});


/* Bloom strength adjuster (scaling is messed up otherwise) */
function calculateBloomStrength() {
    // Adjust these values as needed
    const baseResolution = 1536 * 730;
    const baseStrength = 1;
    const currentResolution = window.innerWidth * window.innerHeight;
    if(currentResolution > baseResolution) {
        return baseStrength * baseResolution / currentResolution;
    } else {
        return baseStrength * currentResolution / baseResolution;
    }
}
function updateBloomStrength() {
    const bloomPass = composer.passes.find(pass => pass instanceof UnrealBloomPass);
    if (bloomPass) {
        bloomPass.strength = calculateBloomStrength();
    }
}


/* Start scene and music */
const audio = new Audio('audio/song.mp3');
audio.volume = 0;
audio.loop = true;
window.addEventListener('keydown', function(event) {
    if (event.keyCode === 13 && !started) {
        startScene();
    }
});