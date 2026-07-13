"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function ThreeParticles({ className }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // --- Floating geometric meshes ---
    const objects: THREE.Mesh[] = [];
    const geometries = [
      new THREE.OctahedronGeometry(0.22, 0),
      new THREE.TetrahedronGeometry(0.18, 0),
      new THREE.IcosahedronGeometry(0.16, 0),
      new THREE.OctahedronGeometry(0.14, 0),
      new THREE.TetrahedronGeometry(0.20, 0),
      new THREE.IcosahedronGeometry(0.24, 0),
      new THREE.OctahedronGeometry(0.12, 0),
      new THREE.TetrahedronGeometry(0.16, 0),
    ];

    const matA = new THREE.MeshBasicMaterial({ color: 0xF7941D, wireframe: true, transparent: true, opacity: 0.55 });
    const matB = new THREE.MeshBasicMaterial({ color: 0xe07810, wireframe: true, transparent: true, opacity: 0.35 });
    const matC = new THREE.MeshBasicMaterial({ color: 0x8C8C8C, wireframe: true, transparent: true, opacity: 0.25 });
    const mats = [matA, matB, matC, matA, matB, matC, matA, matB];

    geometries.forEach((geo, i) => {
      const mesh = new THREE.Mesh(geo, mats[i]);
      mesh.position.set(
        (Math.random() - 0.5) * 9,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 3 - 1
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      (mesh as unknown as { _speed: THREE.Vector3; _rotSpeed: THREE.Vector3 })._speed = new THREE.Vector3(
        (Math.random() - 0.5) * 0.004,
        (Math.random() - 0.5) * 0.006,
        0
      );
      (mesh as unknown as { _rotSpeed: THREE.Vector3 })._rotSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 0.008,
        (Math.random() - 0.5) * 0.008,
        (Math.random() - 0.5) * 0.004
      );
      scene.add(mesh);
      objects.push(mesh);
    });

    // --- Particle field ---
    const particleCount = 180;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4 - 2;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xF7941D, size: 0.022, transparent: true, opacity: 0.45, sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Mouse parallax
    let mx = 0, my = 0;
    const onMouse = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth  - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouse, { passive: true });

    // Resize
    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // Animate
    let rafId: number;
    const clock = new THREE.Clock();

    function animate() {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Smooth camera parallax
      camera.position.x += (mx * 0.3 - camera.position.x) * 0.04;
      camera.position.y += (-my * 0.2 - camera.position.y) * 0.04;

      // Float + rotate objects
      objects.forEach((mesh, i) => {
        const m = mesh as unknown as THREE.Mesh & { _speed: THREE.Vector3; _rotSpeed: THREE.Vector3 };
        mesh.position.x += m._speed.x;
        mesh.position.y += m._speed.y;
        mesh.rotation.x += m._rotSpeed.x;
        mesh.rotation.y += m._rotSpeed.y;
        mesh.rotation.z += m._rotSpeed.z;

        // Bounce bounds
        if (Math.abs(mesh.position.x) > 5) m._speed.x *= -1;
        if (Math.abs(mesh.position.y) > 3) m._speed.y *= -1;

        // Pulse opacity
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.25 + Math.sin(t * 0.6 + i) * 0.12;
      });

      // Rotate particle field slowly
      particles.rotation.y = t * 0.015;
      particles.rotation.x = Math.sin(t * 0.008) * 0.05;

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className={className} style={{ touchAction: "none" }} />;
}
