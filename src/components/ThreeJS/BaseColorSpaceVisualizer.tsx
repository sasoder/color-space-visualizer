import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RGB, SavedColor } from "@/types/color";
import React from "react";

// Define initial view constants
const INITIAL_CAMERA_POSITION = new THREE.Vector3(2.5, 2.5, 5);
const INITIAL_TARGET = new THREE.Vector3(0.5, 0.5, 0.5);

export interface ColorSpaceVisualizerProps {
  rgb: RGB;
  savedColors: SavedColor[];
  selectedId: string;
  shouldReset?: boolean;
  onResetComplete?: () => void;
  showGrid?: boolean;
  scene?: THREE.Scene;
}

export interface VertexLabel {
  pos: [number, number, number];
  label: string;
}

export interface ColorSpaceContainerProps extends ColorSpaceVisualizerProps {
  children: (props: { scene: THREE.Scene }) => React.ReactElement;
}

export function ColorSpaceContainer({
  shouldReset,
  onResetComplete,
  showGrid = false,
  children,
}: ColorSpaceContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    points: Map<string, THREE.Mesh>;
    currentPoint?: THREE.Mesh;
    gridHelpers?: THREE.GridHelper[];
  } | null>(null);
  const [needsInitialReset, setNeedsInitialReset] = React.useState(false);

  // Initial setup of the scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Setup scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f0eb);

    // Setup camera
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);

    // Set initial aspect ratio
    const aspect = width / height;
    if (aspect >= 1) {
      camera.left = -1 * aspect;
      camera.right = 1 * aspect;
      camera.top = 1;
      camera.bottom = -1;
    } else {
      camera.left = -1;
      camera.right = 1;
      camera.top = 1 / aspect;
      camera.bottom = -1 / aspect;
    }

    // Set initial position and orientation
    camera.position.copy(INITIAL_CAMERA_POSITION);
    camera.zoom = 1;
    camera.updateProjectionMatrix();

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);

    // Setup controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.copy(INITIAL_TARGET);
    controls.minZoom = 0.5;
    controls.maxZoom = 2;

    // Create scene-wide volumetric grid
    const gridHelpers = createGridSystem(scene);

    // Store references
    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      points: new Map(),
      gridHelpers,
    };

    // Trigger initial reset once setup is complete
    setNeedsInitialReset(true);

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      if (sceneRef.current) {
        const { controls, renderer, scene, camera } = sceneRef.current;
        controls.update();
        renderer.render(scene, camera);
      }
    }
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      const aspect = width / height;

      if (aspect >= 1) {
        camera.left = -1 * aspect;
        camera.right = 1 * aspect;
        camera.top = 1;
        camera.bottom = -1;
      } else {
        camera.left = -1;
        camera.right = 1;
        camera.top = 1 / aspect;
        camera.bottom = -1 / aspect;
      }
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);
    handleResize();

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Reset view when shouldReset changes to true
  useEffect(() => {
    if (shouldReset && sceneRef.current) {
      const { camera, controls } = sceneRef.current;
      camera.position.copy(INITIAL_CAMERA_POSITION);
      controls.target.copy(INITIAL_TARGET);
      camera.zoom = 1;
      camera.updateProjectionMatrix();
      camera.lookAt(INITIAL_TARGET);
      controls.update();
      onResetComplete?.();
    }
  }, [shouldReset, onResetComplete]);

  // Update grid visibility
  useEffect(() => {
    if (!sceneRef.current?.gridHelpers) return;
    sceneRef.current.gridHelpers.forEach((grid) => {
      grid.visible = showGrid;
    });
  }, [showGrid]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {sceneRef.current?.scene &&
        React.cloneElement(
          children({ scene: sceneRef.current.scene }) as React.ReactElement,
          {
            scene: sceneRef.current.scene,
          }
        )}
    </div>
  );
}

// Helper function to create the grid system
function createGridSystem(scene: THREE.Scene): THREE.GridHelper[] {
  const gridSize = 2.5;
  const divisions = 5;
  const numGrids = 5;
  const gridSpacing = (gridSize * 2) / numGrids;
  const gridHelpers: THREE.GridHelper[] = [];

  // Create horizontal grids (XZ planes)
  for (let i = 0; i < numGrids; i++) {
    const y = -gridSize + i * gridSpacing;
    const gridHelper = new THREE.GridHelper(gridSize * 2, divisions);
    gridHelper.position.set(0, y, 0);
    scene.add(gridHelper);
    gridHelpers.push(gridHelper);
  }

  // Create vertical grids (XY planes)
  for (let i = 0; i < numGrids; i++) {
    const z = -gridSize + i * gridSpacing;
    const gridHelper = new THREE.GridHelper(gridSize * 2, divisions);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.set(0, 0, z);
    scene.add(gridHelper);
    gridHelpers.push(gridHelper);
  }

  // Create side grids (YZ planes)
  for (let i = 0; i < numGrids; i++) {
    const x = -gridSize + i * gridSpacing;
    const gridHelper = new THREE.GridHelper(gridSize * 2, divisions);
    gridHelper.rotation.z = Math.PI / 2;
    gridHelper.position.set(x, 0, 0);
    scene.add(gridHelper);
    gridHelpers.push(gridHelper);
  }

  // Make all grids slightly transparent
  gridHelpers.forEach((grid) => {
    const material = grid.material;
    if (material instanceof THREE.Material) {
      material.opacity = 0.1;
      material.transparent = true;
    } else if (Array.isArray(material)) {
      (material as THREE.Material[]).forEach((mat) => {
        mat.opacity = 0.1;
        mat.transparent = true;
      });
    }
  });

  return gridHelpers;
}

// Helper function to create vertex labels
export function createVertexLabel(
  scene: THREE.Scene,
  position: [number, number, number],
  label: string
) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return;

  canvas.width = 256;
  canvas.height = 64;
  context.fillStyle = "black";
  context.font = "100 48px 'Tinos', serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    sizeAttenuation: false,
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  const [x, y, z] = position;
  sprite.position.set(x + 0.2, y, z);
  sprite.scale.set(0.8 / 1.5, 0.2 / 1.5, 2 / 1.5);
  scene.add(sprite);
  return sprite;
}
