import './valentine.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const mainExperience = document.getElementById('main-experience');
const finalScreen = document.getElementById('final-screen');
const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const loginBtn = document.getElementById('loginBtn');
const errorMsg = document.getElementById('error-msg');
const questionOverlay = document.getElementById('question-overlay');
const jaBtn = document.getElementById('jaBtn');
const neeBtn = document.getElementById('neeBtn');
const plushiesContainer = document.getElementById('plushies-container');

// Audio
const audio = new Audio('audio/valentine.mp3');
audio.volume = 0.5;
audio.loop = true;

// Three.js variables
let scene, camera, renderer, heartModel;
let animationId;
let plushieSprites = [];

// Nee button phrases
const neePhrases = [
    "Nee",
    "Ben je echt zeker?",
    "Please ik zie je graag...",
    "Alsjeblieft? 🥺",
    "Voor Teun 🥺🥺🥺",
    "🥺🥺🥺🥺🥺"
];
let neeIndex = 0;
let jaScale = 1;

// Plushie images
const plushieImages = ['img/teun.png', 'img/walter.png'];

// Login validation
loginBtn.addEventListener('click', validateLogin);
firstNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') validateLogin();
});
lastNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') validateLogin();
});

function validateLogin() {
    const firstName = firstNameInput.value.trim().toLowerCase();
    const lastName = lastNameInput.value.trim().toLowerCase();
    
    if (firstName === 'jill' && lastName === 'buyse') {
        loginScreen.style.opacity = '0';
        setTimeout(() => {
            loginScreen.style.display = 'none';
            mainExperience.style.display = 'block';
            startExperience();
        }, 500);
    } else {
        errorMsg.textContent = 'Onjuist, probeer opnieuw.';
        errorMsg.style.animation = 'shake 0.5s';
        setTimeout(() => {
            errorMsg.style.animation = '';
        }, 500);
    }
}

function startExperience() {
    // Start audio
    audio.play().catch(e => console.log('Audio autoplay blocked:', e));
    
    // Initialize Three.js scene
    initThreeJS();
    
    // Start floating plushies
    createFloatingPlushies();
    
    // Show question after delay
    setTimeout(() => {
        questionOverlay.style.display = 'flex';
        questionOverlay.style.animation = 'fadeIn 1s ease-in-out';
    }, 5000);
}

function initThreeJS() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xff6b9d);
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 100;
    camera.position.y = 50;
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#bg'),
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(50, 50, 100);
    scene.add(directionalLight);
    
    const pointLight = new THREE.PointLight(0xff69b4, 2, 500);
    pointLight.position.set(0, 0, 100);
    scene.add(pointLight);
    
    // Load heart model
    const loader = new GLTFLoader();
    loader.load('models/valentine/hearth.gltf', function(gltf) {
        heartModel = gltf.scene;
        heartModel.position.set(0, 20, 0);
        scene.add(heartModel);
        console.log('Heart model loaded successfully!');
    }, undefined, function(error) {
        console.error('Error loading heart model:', error);
    });
    
    // Add particles for extra magic
    createHeartParticles();
    
    // Handle resize
    window.addEventListener('resize', onWindowResize);
    
    // Start animation
    animate();
}

function createHeartParticles() {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 300;
        positions[i + 1] = (Math.random() - 0.5) * 300;
        positions[i + 2] = (Math.random() - 0.5) * 300;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        color: 0xffc0cb,
        size: 2,
        transparent: true,
        opacity: 0.8
    });
    
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

function animate() {
    animationId = requestAnimationFrame(animate);
    
    const time = Date.now() * 0.001;
    
    // Rotate heart model
    if (heartModel) {
        heartModel.rotation.y += 0.01;
        // Add subtle floating motion
        heartModel.position.y = 20 + Math.sin(time) * 5;
    }
    
    // Animate plushie sprites
    plushieSprites.forEach((sprite, i) => {
        const data = sprite.userData;
        sprite.position.x = data.baseX + Math.sin(time * data.speedX + data.offsetX) * data.rangeX;
        sprite.position.y = data.baseY + Math.sin(time * data.speedY + data.offsetY) * data.rangeY;
        sprite.position.z = data.baseZ + Math.sin(time * data.speedZ + data.offsetZ) * data.rangeZ;
    });
    
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function createFloatingPlushies() {
    const textureLoader = new THREE.TextureLoader();
    
    // Load both textures
    plushieImages.forEach((imgPath, imgIndex) => {
        textureLoader.load(imgPath, (texture) => {
            // Create multiple sprites per image
            for (let i = 0; i < 6; i++) {
                createPlushieSprite(texture, imgIndex * 6 + i);
            }
        });
    });
}

function createPlushieSprite(texture, index) {
    const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        opacity: 1,
        color: 0xcccccc  // Slightly darken the sprites
    });
    
    const sprite = new THREE.Sprite(spriteMaterial);
    
    // Get aspect ratio from texture to avoid squashing
    const aspectRatio = texture.image.width / texture.image.height;
    
    // Random size between 15-30 units
    // Scale based on the largest dimension so all sprites have similar visual size
    const baseSize = 15 + Math.random() * 15;
    if (aspectRatio >= 1) {
        // Wider than tall: width = baseSize, height = baseSize / aspectRatio
        sprite.scale.set(baseSize, baseSize / aspectRatio, 1);
    } else {
        // Taller than wide: height = baseSize, width = baseSize * aspectRatio
        sprite.scale.set(baseSize * aspectRatio, baseSize, 1);
    }
    
    // Random starting position around the scene - fully randomized
    const angle = Math.random() * Math.PI * 2;
    const radius = 80 + Math.random() * 60;
    
    // Randomize Z position so sprites are evenly distributed in front and behind
    const zOffset = (Math.random() - 0.5) * 100;
    
    sprite.userData = {
        baseX: Math.cos(angle) * radius,
        baseY: (Math.random() - 0.5) * 100,
        baseZ: zOffset,
        rangeX: 20 + Math.random() * 30,
        rangeY: 15 + Math.random() * 20,
        rangeZ: 20 + Math.random() * 30,
        speedX: 0.3 + Math.random() * 0.4,
        speedY: 0.4 + Math.random() * 0.3,
        speedZ: 0.2 + Math.random() * 0.3,
        offsetX: Math.random() * Math.PI * 2,
        offsetY: Math.random() * Math.PI * 2,
        offsetZ: Math.random() * Math.PI * 2
    };
    
    sprite.position.set(
        sprite.userData.baseX,
        sprite.userData.baseY,
        sprite.userData.baseZ
    );
    
    scene.add(sprite);
    plushieSprites.push(sprite);
}

// Button event handlers
jaBtn.addEventListener('click', () => {
    // Stop everything and show final screen
    cancelAnimationFrame(animationId);
    audio.pause();
    
    mainExperience.style.opacity = '0';
    setTimeout(() => {
        mainExperience.style.display = 'none';
        finalScreen.style.display = 'flex';
        finalScreen.style.animation = 'fadeIn 1s ease-in-out';
    }, 500);
});

neeBtn.addEventListener('click', () => {
    // Increase Ja button size
    jaScale += 0.3;
    jaBtn.style.transform = `scale(${jaScale})`;
    
    // Cycle through Nee phrases
    neeIndex++;
    if (neeIndex < neePhrases.length) {
        neeBtn.textContent = neePhrases[neeIndex];
    } else {
        // Make Nee button run away
        neeBtn.style.position = 'absolute';
        const randomX = Math.random() * 200 - 100;
        const randomY = Math.random() * 200 - 100;
        neeBtn.style.transform = `translate(${randomX}px, ${randomY}px)`;
    }
    
    // Add shake animation to question
    questionOverlay.querySelector('h2').style.animation = 'shake 0.5s';
    setTimeout(() => {
        questionOverlay.querySelector('h2').style.animation = '';
    }, 500);
});
