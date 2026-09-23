import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ==========================================
// 1. ESCENA, CÁMARA Y RENDERER
// ==========================================
const scene = new THREE.Scene();

// Definimos los colores del cielo para la transición (Día a Azul Rey Obscuro)
const colorDia = new THREE.Color(0x87CEEB);
const colorNoche = new THREE.Color(0x0a1931); // Azul rey obscuro / nocturno

// Inicializamos el fondo con el color de día
scene.background = colorDia; 
document.body.style.backgroundColor = '#' + colorDia.getHexString();

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const initialCameraPos = new THREE.Vector3(0, 8, 15);
camera.position.copy(initialCameraPos);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 3, 0);

// ==========================================
// 2. ILUMINACIÓN
// ==========================================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(10, 15, 10);
dirLight.castShadow = true;
scene.add(dirLight);

// ==========================================
// 3. CONSTRUCCIÓN DE LA PLANTA (JERARQUÍA)
// ==========================================
const interactableObjects = [];

// A) Suelo (Cilindro base)
const sueloGeo = new THREE.CylinderGeometry(5, 5, 0.5, 32);
const sueloMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); 
const suelo = new THREE.Mesh(sueloGeo, sueloMat);
suelo.receiveShadow = true;
suelo.userData = { 
    name: "Suelo Agrícola", 
    type: "Cilindro", 
    height: "0m", 
    desc: "Suelo con colores rojizos simulando la tierra rica en hierro de Los Altos de Jalisco."
};
scene.add(suelo);
interactableObjects.push(suelo);

// Grupo principal de la planta
const agaveGroup = new THREE.Group();
agaveGroup.position.y = 0.25; 
scene.add(agaveGroup);

// B) Piña (Esfera estirada)
const pinaGeo = new THREE.SphereGeometry(1.2, 32, 32);
pinaGeo.scale(1, 1.2, 1); 
const pinaMat = new THREE.MeshStandardMaterial({ color: 0xdbd8a0, roughness: 0.9 });
const pina = new THREE.Mesh(pinaGeo, pinaMat);
pina.position.y = 1.2;
pina.castShadow = true;
pina.userData = { 
    name: "Piña (Corazón)", 
    type: "Esfera", 
    height: "0.2m - 2.5m", 
    desc: "Almacena la biomasa y la concentración de azúcares." 
};
agaveGroup.add(pina);
interactableObjects.push(pina);

// C) Quiote (Tallo floral)
const quioteGeo = new THREE.CylinderGeometry(0.15, 0.2, 5, 16);
quioteGeo.translate(0, 2.5, 0); 
const quioteMat = new THREE.MeshStandardMaterial({ color: 0x7a9c59 });
const quiote = new THREE.Mesh(quioteGeo, quioteMat);
quiote.position.y = 2.4;
quiote.castShadow = true;
quiote.userData = { 
    name: "Quiote (Tallo floral)", 
    type: "Cilindro", 
    height: "Hasta 5 metros", 
    desc: "Tallo que crece rápidamente si no se realiza el desquiote."
};
agaveGroup.add(quiote);
interactableObjects.push(quiote);

// D) Pencas (Roseta corregida y aumentada)
const pencasGroup = new THREE.Group();
const pencaMat = new THREE.MeshStandardMaterial({ color: 0x5a7d71 }); // Azul verdoso

const capas = 5; // Aumentamos a 5 capas de hojas
const pencasPorCapa = 12; // Más hojas por cada capa

for (let i = 0; i < capas; i++) {
    for (let j = 0; j < pencasPorCapa; j++) {
        // 1. Creamos un pivote en el centro de la piña
        const pivote = new THREE.Group();
        
        // 2. Rotamos el pivote como las manecillas de un reloj
        const anguloBase = (j / pencasPorCapa) * Math.PI * 2;
        const desfase = (i % 2) * (Math.PI / pencasPorCapa); // Intercalar capas
        pivote.rotation.y = anguloBase + desfase;
        
        // Posición del pivote (las hojas más nuevas/arriba salen más alto)
        pivote.position.y = 0.5 + (i * 0.4);

        // 3. Creamos la geometría de la hoja
        const alturaPenca = 3.5 + (i * 0.2); // Más altas las del centro
        const pencaGeo = new THREE.ConeGeometry(0.4, alturaPenca, 5);
        pencaGeo.translate(0, alturaPenca / 2, 0); // Mover el ancla a la base
        
        const penca = new THREE.Mesh(pencaGeo, pencaMat);
        
        // ¡TRUCO!: Aplastamos el cono en el eje Z para que parezca una hoja plana
        penca.scale.set(1, 1, 0.15); 
        
        // 4. Inclinamos la hoja hacia afuera (las de abajo más caídas, las de arriba más verticales)
        const inclinacion = (Math.PI / 2.2) - (i * 0.22);
        penca.rotation.x = inclinacion;
        penca.castShadow = true;
        
        penca.userData = {
            name: `Penca (Capa ${i+1})`,
            type: "Cono Modificado",
            height: "1.5m - 3.5m",
            desc: "Si hay sequía constante, la planta detiene su crecimiento y toma un tono rojizo."
        };
        
        // Añadimos la penca al pivote, y el pivote al grupo de pencas
        pivote.add(penca);
        pencasGroup.add(pivote);
        interactableObjects.push(penca); // Agregamos solo la malla al raycaster
    }
}
agaveGroup.add(pencasGroup);

// ==========================================
// 4. RAYCASTING Y PANEL DE INFORMACIÓN
// ==========================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const infoPanel = document.getElementById('info-panel');
const uiName = document.getElementById('info-name');
const uiType = document.getElementById('info-type');
const uiHeight = document.getElementById('info-height');
const uiDesc = document.getElementById('info-desc');

let selectedObject = null;
let originalEmissive = new THREE.Color(0x000000);

window.addEventListener('pointerdown', (event) => {
    if (event.target.closest('#controls-panel')) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    // Verificar intersección solo con los objetos en el arreglo
    const intersects = raycaster.intersectObjects(interactableObjects, false);

    if (intersects.length > 0) {
        const hit = intersects[0].object;

        if (selectedObject && selectedObject.material) {
            selectedObject.material.emissive.copy(originalEmissive);
        }

        selectedObject = hit;
        
        if (selectedObject.material) {
            originalEmissive.copy(selectedObject.material.emissive);
            selectedObject.material.emissive.setHex(0x333333); 
        }

        const data = selectedObject.userData;
        if(data) {
            uiName.innerText = data.name;
            uiType.innerText = data.type;
            uiHeight.innerText = data.height;
            uiDesc.innerText = data.desc;
            infoPanel.classList.remove('hidden');
        }

    } else {
        if (selectedObject && selectedObject.material) {
            selectedObject.material.emissive.copy(originalEmissive);
        }
        selectedObject = null;
        infoPanel.classList.add('hidden');
    }
});

// ==========================================
// 5. CONTROLES HTML INTERACTIVOS Y AMBIENTE
// ==========================================
let isAnimating = true;

document.getElementById('btn-anim').addEventListener('click', (e) => {
    isAnimating = !isAnimating;
    e.target.innerText = isAnimating ? "Pausar Viento" : "Reanudar Viento";
});

document.getElementById('btn-camera').addEventListener('click', () => {
    camera.position.copy(initialCameraPos);
    controls.target.set(0, 3, 0);
});

let sequiaActiva = false;
document.getElementById('btn-color-leaves').addEventListener('click', () => {
    sequiaActiva = !sequiaActiva;
    const colorDestino = sequiaActiva ? 0xcc5533 : 0x5a7d71; 
    
    // Como ahora usamos pivotes (Grupos), usamos traverse para pintar solo las mallas
    pencasGroup.traverse((child) => {
        if (child.isMesh) {
            child.material.color.setHex(colorDestino);
        }
    });
});

document.getElementById('btn-toggle-leaves').addEventListener('click', (e) => {
    pencasGroup.visible = !pencasGroup.visible;
    e.target.innerText = pencasGroup.visible ? "Ocultar Pencas" : "Mostrar Pencas";
});

// NUEVA LÓGICA: Slider controla luz Y color de fondo
document.getElementById('light-slider').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    
    // 1. Ajustar intensidad de las luces
    dirLight.intensity = val;
    ambientLight.intensity = val * 0.4; // Ajuste proporcional

    // 2. Calcular porcentaje (0 a 1) en base al slider (rango 0 a 3)
    const porcentajeDia = val / 3;

    // 3. Mezclar colores (Lerp): Si es 0% día, es azul obscuro. Si es 100% día, es celeste.
    const nuevoColorFondo = colorNoche.clone().lerp(colorDia, porcentajeDia);
    
    // 4. Aplicarlo a la escena de Three.js y al fondo del body HTML
    scene.background = nuevoColorFondo;
    document.body.style.backgroundColor = '#' + nuevoColorFondo.getHexString();
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==========================================
// 6. ANIMACIÓN (BALANCEO POR VIENTO)
// ==========================================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    if (isAnimating) {
        const time = clock.getElapsedTime();
        agaveGroup.rotation.z = Math.sin(time * 0.5) * 0.02;
        agaveGroup.rotation.x = Math.cos(time * 0.3) * 0.02;
    }

    controls.update();
    renderer.render(scene, camera);
}
animate();