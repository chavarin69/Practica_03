# Práctica 03 - Plantas 3D: Simulador de Agave Azul

**Autor:** Chavarin & Godinez  
**Materia:** Bioinformática y Biología Computacional Avanzados

## Descripción del Proyecto
Este proyecto es una representación 3D interactiva del ciclo biológico del *Agave tequilana Weber variedad azul* [version beta]. En lugar de un escenario genérico, la escena aísla una única planta central sobre su terreno, demostrando el uso de geometrías primitivas, agrupaciones jerárquicas y eventos de raycasting en **Three.js**.

## Cumplimiento de Requisitos
*   **Tema:** El proceso biológico de crecimiento del Agave azul.
*   **Geometrías Utilizadas (Mínimo 3):**
    *   **Esferas:** Modificadas mediante escalado para representar la *Piña*.
    *   **Cilindros:** Utilizados tanto para el terreno base como para representar el *Quiote*, un cilindro texturizado de hasta 5 metros de altura.
    *   **Conos:** Utilizados y generados mediante bucles for anidados para formar múltiples capas de *Pencas*.
*   **Jerarquías:** Se utilizó `THREE.Group` para agrupar todas las pencas (`pencasGroup`), las cuales a su vez pertenecen al grupo global de la planta (`agaveGroup`).
*   **Interacción y Lógica:** 
    *   **Raycasting:** Al hacer clic en las partes, el panel muestra la información.
    *   **Controles UI:** El botón de "Simular Sequía" transiciona el color de las hojas, debido a que si se presenta sequía constante, la planta detiene su crecimiento y las pencas toman un tono rojizo.
    *   El suelo está renderizado con colores rojizos (simulando la tierra rica en hierro de Los Altos de Jalisco).

## Cómo Ejecutar
1. Clonar el repositorio.
2. Iniciar un servidor local (Ej. extensión Live Server en VS Code o usando XAMPP).
3. Abrir el archivo `index.html` en el navegador.
