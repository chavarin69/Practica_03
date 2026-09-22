import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ==========================================
// 1. CONFIGURACIÓN BÁSICA
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222831);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const initialCameraPos = new THREE.Vector3(0, 4, 10);
camera.position.copy(initialCameraPos);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 2, 0);
controls.enableDamping = true;

// ==========================================
// 2. ILUMINACIÓN
// ==========================================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 10, 5);
dirLight.castShadow = true;
scene.add(dirLight);

// ==========================================
// 3. CONSTRUCCIÓN DE LA PLANTA Y MODELOS
// ==========================================
const interactableObjects = [];
const leavesArray = []; 

// 3.1 Grupo Principal (Planta Procedural)
const plantGroup = new THREE.Group();
scene.add(plantGroup);

const stemMat = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.8 });
const leafMat = new THREE.MeshStandardMaterial({ color: 0x81c784, roughness: 0.6 });
const flowerMat = new THREE.MeshStandardMaterial({ color: 0xff4081, roughness: 0.4 });
const potMat = new THREE.MeshStandardMaterial({ color: 0xd84315, roughness: 0.9 });

// 3.2 Maceta (Cono invertido)
const potGeo = new THREE.ConeGeometry(1.5, 2, 32);
const pot = new THREE.Mesh(potGeo, potMat);
pot.rotation.x = Math.PI; 
pot.position.set(0, 1, 0);
pot.castShadow = true;
pot.userData = { 
    name: "Maceta de Arcilla", 
    geom: "Cono (Invertido)", 
    height: "0 a 2 unidades", 
    desc: "Base que contiene los nutrientes y raíces." 
};
scene.add(pot); 
interactableObjects.push(pot);

// 3.3 Tallo Principal
const stemGeo = new THREE.CylinderGeometry(0.2, 0.3, 4, 16);
const stem = new THREE.Mesh(stemGeo, stemMat);
stem.position.y = 4; 
stem.castShadow = true;
stem.userData = { 
    name: "Tallo Principal", 
    geom: "Cilindro", 
    height: "2 a 6 unidades", 
    desc: "Soporta las hojas y transporta agua." 
};
plantGroup.add(stem);
interactableObjects.push(stem);

// Función para crear ramas con hojas
function createBranchWithLeaf(yPos, rotationZ, leafScale) {
    const branchGroup = new THREE.Group();
    branchGroup.position.y = yPos;
    branchGroup.rotation.z = rotationZ;

    const branchGeo = new THREE.CylinderGeometry(0.05, 0.1, 1.5, 8);
    const branch = new THREE.Mesh(branchGeo, stemMat);
    branch.position.y = 0.75; 
    branch.userData = { name: "Rama Secundaria", geom: "Cilindro", height: `${yPos} unidades`, desc: "Extensión del tallo hacia la luz." };
    interactableObjects.push(branch);
    branchGroup.add(branch);

    const leafGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.y = 1.5;
    leaf.scale.set(leafScale, leafScale, 0.2); 
    leaf.userData = { name: "Hoja Fotosintética", geom: "Esfera (Modificada)", height: `${yPos + 1.5} unidades`, desc: "Capta la luz solar para la fotosíntesis." };
    
    interactableObjects.push(leaf);
    leavesArray.push(leaf);
    branchGroup.add(leaf);

    return branchGroup;
}

stem.add(createBranchWithLeaf(0, Math.PI / 4, 1));
stem.add(createBranchWithLeaf(1, -Math.PI / 3, 0.8));
stem.add(createBranchWithLeaf(-1, Math.PI / 3, 1.2));

// 3.4 Flor
const flowerGeo = new THREE.SphereGeometry(0.6, 32, 32);
const flower = new THREE.Mesh(flowerGeo, flowerMat);
flower.position.y = 2.2; 
flower.userData = { 
    name: "Brote Floral", 
    geom: "Esfera", 
    height: "6.2 unidades", 
    desc: "Órgano reproductor de la planta." 
};
interactableObjects.push(flower);
stem.add(flower);

// 3.5 Modelo Externo: Agave (.glb)
const loader = new GLTFLoader();
let agaveModel = null;

loader.load('assets/agave.glb', (gltf) => {
    agaveModel = gltf.scene;
    
    // Posicionamos el agave a un lado para que no choque con la otra planta
    agaveModel.position.set(4, 0, 0); 
    agaveModel.scale.set(5, 5, 5); 

    agaveModel.userData = {
        name: "Agave Americana",
        geom: "Modelo GLB (.glb)",
        height: "Variable",
        desc: "Sujeto de pruebas para simulación de variables ambientales."
    };

    agaveModel.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.userData = agaveModel.userData; 
        }
    });

    scene.add(agaveModel);
    interactableObjects.push(agaveModel); 
    
}, undefined, (error) => {
    console.error("Error al cargar el agave:", error);
});

// ==========================================
// 4. RAYCASTING Y PANEL DE INFORMACIÓN
// ==========================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const infoPanel = document.getElementById('info-panel');
const uiName = document.getElementById('info-name');
const uiGeom = document.getElementById('info-geometry');
const uiHeight = document.getElementById('info-height');
const uiDesc = document.getElementById('info-desc');

let selectedMesh = null;
let originalEmissive = new THREE.Color();

window.addEventListener('pointerdown', (event) => {
    if(event.target.tagName === 'BUTTON' || event.target.tagName === 'INPUT' || event.target.closest('#controls-panel')) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactableObjects, false);

    if (selectedMesh && selectedMesh.material && selectedMesh.material.emissive) {
        selectedMesh.material.emissive.copy(originalEmissive);
    }

    if (intersects.length > 0) {
        selectedMesh = intersects[0].object;
        
        if (selectedMesh.material && selectedMesh.material.emissive) {
            originalEmissive.copy(selectedMesh.material.emissive);
            selectedMesh.material.emissive.setHex(0x333333); 
        }

        const data = selectedMesh.userData;
        if(data && data.name) {
            uiName.innerText = data.name;
            uiGeom.innerText = data.geom;
            uiHeight.innerText = data.height;
            uiDesc.innerText = data.desc;
            infoPanel.classList.remove('hidden');
        }
    } else {
        selectedMesh = null;
        infoPanel.classList.add('hidden');
    }
});

// ==========================================
// 5. CONTROLES HTML
// ==========================================
let isAnimating = true;

document.getElementById('btn-anim').addEventListener('click', (e) => {
    isAnimating = !isAnimating;
    e.target.innerText = isAnimating ? "Pausar Animación" : "Reanudar Animación";
});

document.getElementById('btn-leaf-color').addEventListener('click', () => {
    const randomColor = Math.random() * 0xffffff;
    leavesArray.forEach(leaf => {
        leaf.material = leaf.material.clone(); 
        leaf.material.color.setHex(randomColor);
    });
});

let leavesVisible = true;
document.getElementById('btn-toggle-leaves').addEventListener('click', (e) => {
    leavesVisible = !leavesVisible;
    leavesArray.forEach(leaf => leaf.visible = leavesVisible);
    e.target.innerText = leavesVisible ? "Ocultar Hojas" : "Mostrar Hojas";
});

document.getElementById('btn-camera').addEventListener('click', () => {
    camera.position.copy(initialCameraPos);
    controls.target.set(0, 2, 0);
});

document.getElementById('light-slider').addEventListener('input', (e) => {
    dirLight.intensity = parseFloat(e.target.value);
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==========================================
// 6. ANIMACIÓN
// ==========================================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    if (isAnimating) {
        const time = clock.getElapsedTime();
        plantGroup.rotation.z = Math.sin(time * 0.5) * 0.05;
        plantGroup.rotation.x = Math.cos(time * 0.3) * 0.05;
        flower.rotation.y = time;
        
        if(agaveModel) {
            agaveModel.rotation.y = time * 0.2;
        }
    }

    controls.update();
    renderer.render(scene, camera);
}
animate();