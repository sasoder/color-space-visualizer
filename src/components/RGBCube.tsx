import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { SavedColor } from "@/types/color";

// Define initial view constants
const INITIAL_CAMERA_POSITION = new THREE.Vector3(2.5, 2.5, 5);
const INITIAL_TARGET = new THREE.Vector3(0.5, 0.5, 0.5);

interface RGBCubeProps {
  rgb: [number, number, number];
  savedColors: SavedColor[];
  selectedId: string;
  shouldReset?: boolean;
  onResetComplete?: () => void;
  showGrid?: boolean;
}

export function RGBCube({
  rgb,
  savedColors,
  selectedId,
  shouldReset,
  onResetComplete,
  showGrid = false,
}: RGBCubeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    points: Map<string, THREE.Mesh>;
    currentPoint?: THREE.Mesh;
    visibleEdges?: THREE.LineSegments;
    hiddenEdges?: THREE.LineSegments;
    cube?: THREE.Mesh;
    gridHelpers?: THREE.GridHelper[];
  } | null>(null);

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
    camera.position.set(2.5, 2.5, 5);
    camera.lookAt(0.5, 0.5, 0.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);

    // Create cube geometry and invisible mesh for raycasting
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    cubeGeometry.translate(0.5, 0.5, 0.5);
    const cubeMaterial = new THREE.MeshBasicMaterial({
      visible: false, // Make the cube invisible
      side: THREE.BackSide, // Important for correct raycasting
    });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    scene.add(cube);

    const createEdgeGeometries = () => {
      // Get the edges from the cube geometry
      const edges = new THREE.EdgesGeometry(cubeGeometry);
      const positions = edges.attributes.position.array;

      const visiblePositions: number[] = [];
      const hiddenPositions: number[] = [];

      // Helper to decide if an edge is visible
      const isEdgeVisible = (
        start: THREE.Vector3,
        end: THREE.Vector3,
        cameraPos: THREE.Vector3
      ) => {
        // Compute the midpoint of the edge
        const midPoint = new THREE.Vector3()
          .addVectors(start, end)
          .multiplyScalar(0.5);
        // The vector from the midpoint to the camera
        const viewDir = new THREE.Vector3().subVectors(cameraPos, midPoint);

        // Determine which coordinates are constant (the fixed indices)
        const fixedIndices: number[] = [];
        for (let idx = 0; idx < 3; idx++) {
          if (
            Math.abs(start.getComponent(idx) - end.getComponent(idx)) < 0.0001
          ) {
            fixedIndices.push(idx);
          }
        }
        // For a cube edge, there should be exactly 2 fixed indices.
        // For each fixed index we can compute a face normal.
        // Convention: if the value of the fixed coordinate is 0, the normal is -1; if 1, the normal is +1.
        let visible = false;
        fixedIndices.forEach((i) => {
          const value = start.getComponent(i); // same for both start and end
          const normal = new THREE.Vector3();
          normal.setComponent(i, value === 0 ? -1 : 1);
          // If the viewDir has a positive dot product with this normal,
          // then that face is oriented toward the camera.
          if (viewDir.dot(normal) > 0) {
            visible = true;
          }
        });
        return visible;
      };

      // Process each edge (each edge is defined by 2 endpoints, i.e. 6 numbers)
      for (let i = 0; i < positions.length; i += 6) {
        const start = new THREE.Vector3(
          positions[i],
          positions[i + 1],
          positions[i + 2]
        );
        const end = new THREE.Vector3(
          positions[i + 3],
          positions[i + 4],
          positions[i + 5]
        );

        // Use the helper to decide if the edge is visible.
        // We pass in the current camera position.
        if (isEdgeVisible(start, end, camera.position)) {
          visiblePositions.push(...start.toArray(), ...end.toArray());
        } else {
          hiddenPositions.push(...start.toArray(), ...end.toArray());
        }
      }

      return {
        visible: new THREE.BufferGeometry().setAttribute(
          "position",
          new THREE.Float32BufferAttribute(visiblePositions, 3)
        ),
        hidden: new THREE.BufferGeometry().setAttribute(
          "position",
          new THREE.Float32BufferAttribute(hiddenPositions, 3)
        ),
      };
    };

    // Create materials
    const solidMaterial = new THREE.LineBasicMaterial({
      color: 0x000000,
      linewidth: 1,
    });

    const dashedMaterial = new THREE.LineDashedMaterial({
      color: 0x000000,
      dashSize: 0.05,
      gapSize: 0.05,
      linewidth: 1,
    });

    // Create initial edge geometries
    const { visible, hidden } = createEdgeGeometries();

    // Create line segments
    const visibleEdges = new THREE.LineSegments(visible, solidMaterial);
    const hiddenEdges = new THREE.LineSegments(hidden, dashedMaterial);
    hiddenEdges.computeLineDistances();

    scene.add(visibleEdges);
    scene.add(hiddenEdges);

    // Create current point indicator
    const currentPointGeometry = new THREE.SphereGeometry(0.02);
    const currentPointMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.7,
    });
    const currentPoint = new THREE.Mesh(
      currentPointGeometry,
      currentPointMaterial
    );
    scene.add(currentPoint);

    // Create scene-wide volumetric grid
    const gridSize = 2.5; // Reduced size (25% of original 10)
    const divisions = 10;
    const numGrids = 10; // Number of grids in each direction
    const gridSpacing = (gridSize * 2) / numGrids; // Space between grids
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

    // Make all grids slightly transparent and adjust color
    gridHelpers.forEach((grid) => {
      const material = grid.material;
      if (material instanceof THREE.Material) {
        material.opacity = 0.1; // Reduced opacity to 10%
        material.transparent = true;
      } else if (Array.isArray(material)) {
        (material as THREE.Material[]).forEach((mat: THREE.Material) => {
          mat.opacity = 0.1; // Reduced opacity to 10%
          mat.transparent = true;
        });
      }
    });

    // Setup controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0.5, 0.5, 0.5);
    controls.minZoom = 0.5;
    controls.maxZoom = 2;

    // Store references
    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      points: new Map(),
      currentPoint,
      visibleEdges,
      hiddenEdges,
      cube,
      gridHelpers,
    };

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      if (sceneRef.current) {
        const { controls, renderer, scene, camera, visibleEdges, hiddenEdges } =
          sceneRef.current;
        controls.update();

        // Update edges based on new camera position
        if (visibleEdges && hiddenEdges) {
          const { visible, hidden } = createEdgeGeometries();
          visibleEdges.geometry.dispose();
          hiddenEdges.geometry.dispose();
          visibleEdges.geometry = visible;
          hiddenEdges.geometry = hidden;
          hiddenEdges.computeLineDistances();
        }

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

    // Add vertex labels with paper-like style
    const vertices = [
      { pos: [0, 0, 0], label: "Black" },
      { pos: [1, 0, 0], label: "Red" },
      { pos: [0, 1, 0], label: "Green" },
      { pos: [0, 0, 1], label: "Blue" },
      { pos: [1, 1, 0], label: "Yellow" },
      { pos: [1, 0, 1], label: "Magenta" },
      { pos: [0, 1, 1], label: "Cyan" },
      { pos: [1, 1, 1], label: "White" },
    ];

    vertices.forEach(({ pos, label }) => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) return;

      canvas.width = 256;
      canvas.height = 64;
      context.fillStyle = "black";
      context.font = "48px 'Tinos', serif";
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
      const [x, y, z] = pos;
      sprite.position.set(x + 0.2, y, z);
      sprite.scale.set(0.8 / 1.5, 0.2 / 1.5, 2 / 1.5);
      scene.add(sprite);
    });

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Update current point position
  useEffect(() => {
    if (!sceneRef.current?.currentPoint) return;
    const [r, g, b] = rgb;
    const position: [number, number, number] = [r / 255, g / 255, b / 255];
    sceneRef.current.currentPoint.position.set(
      position[0],
      position[1],
      position[2]
    );
    const material = sceneRef.current.currentPoint
      .material as THREE.MeshBasicMaterial;
    material.color.setRGB(position[0], position[1], position[2]);
  }, [rgb]);

  // Update saved points
  useEffect(() => {
    if (!sceneRef.current) return;
    const { scene, points } = sceneRef.current;

    // Remove points that are no longer in savedColors
    for (const [id, point] of points.entries()) {
      if (!savedColors.find((c) => c.id === id)) {
        scene.remove(point);
        points.delete(id);
      }
    }

    // Update or add points for each saved color
    savedColors.forEach((color) => {
      if (color.type !== "point") return;

      const [r, g, b] = color.rgb;
      const position: [number, number, number] = [r / 255, g / 255, b / 255];

      let point = points.get(color.id);

      if (!point) {
        const geometry = new THREE.SphereGeometry(0.02);
        const material = new THREE.MeshBasicMaterial({
          color: new THREE.Color(position[0], position[1], position[2]),
          transparent: true,
        });
        point = new THREE.Mesh(geometry, material);
        scene.add(point);
        points.set(color.id, point);
      }

      point.position.set(position[0], position[1], position[2]);
      const material = point.material as THREE.MeshBasicMaterial;
      material.color.setRGB(position[0], position[1], position[2]);

      if (color.id === selectedId) {
        point.scale.set(1.5, 1.5, 1.5);
        material.opacity = 1;
      } else {
        point.scale.set(1, 1, 1);
        material.opacity = 0.7;
      }
    });
  }, [savedColors, selectedId]);

  // Update grid visibility
  useEffect(() => {
    if (!sceneRef.current?.gridHelpers) return;
    sceneRef.current.gridHelpers.forEach((grid) => {
      grid.visible = showGrid;
    });
  }, [showGrid]);

  return <div ref={containerRef} className="w-full h-full relative"></div>;
}
