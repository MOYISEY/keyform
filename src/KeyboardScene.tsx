import { useEffect, useRef, useState } from "react";
import * as T from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  CAP_COLORS,
  CASE_COLORS,
  SWITCH_COLORS,
  keysFor,
  type Config,
  type Part,
  type Lang,
} from "./model";
interface Props {
  config: Config;
  explode: number;
  part: Part | null;
  onPart: (p: Part) => void;
  pressed: Set<string>;
  command: { id: number; action: string };
  lang: Lang;
  onReady: (ok: boolean) => void;
}
function roundShape(w: number, h: number, r: number) {
  const s = new T.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}
export default function KeyboardScene(props: Props) {
  const wakeRef = useRef<() => void>(() => {});
  const host = useRef<HTMLDivElement>(null);
  const live = useRef(props);
  live.current = props;
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    wakeRef.current();
  }, [props.explode, props.part, props.pressed, props.command]);
  useEffect(() => {
    const el = host.current!;
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      setFailed(true);
      setLoading(false);
      live.current.onReady(false);
      return;
    }
    setFailed(false);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      "aria-label",
      props.lang === "ru"
        ? "3D-модель клавиатуры. Перетащите для вращения."
        : "3D keyboard. Drag to rotate.",
    );
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(34, 1, 0.1, 150);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.12;
    controls.enablePan = false;
    controls.minDistance = 13;
    controls.maxDistance = 48;
    controls.maxPolarAngle = Math.PI * 0.82;
    controls.minPolarAngle = 0.13;
    const pmrem = new T.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.7;
    room.dispose();
    pmrem.dispose();
    scene.add(new T.HemisphereLight(0xffffff, 0xc5c1b4, 0.7));
    const light = new T.DirectionalLight(0xfff8ed, 2.2);
    light.position.set(-6, 15, 8);
    light.castShadow = true;
    light.shadow.mapSize.set(2048, 2048);
    Object.assign(light.shadow.camera, {
      left: -15,
      right: 15,
      top: 15,
      bottom: -15,
      near: 1,
      far: 45,
    });
    light.shadow.bias = -0.0004;
    light.shadow.normalBias = 0.03;
    light.shadow.radius = 4;
    scene.add(light);
    const fill = new T.DirectionalLight(0xe8efff, 0.8);
    fill.position.set(12, 9, -9);
    scene.add(fill);
    const floor = new T.Mesh(
      new T.PlaneGeometry(200, 200),
      new T.ShadowMaterial({ opacity: 0.14 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    scene.add(floor);
    const root = new T.Group();
    root.rotation.y = -0.12;
    scene.add(root);
    const keys = keysFor(props.config.layout);
    const maxX = Math.max(...keys.map((k) => k.x + k.w / 2));
    const maxZ = Math.max(...keys.map((k) => k.z));
    const width = maxX + 0.8,
      depth = maxZ + 1.8;
    const layers = Object.fromEntries(
      ["case", "pcb", "plate", "switches", "caps"].map((p) => {
        const g = new T.Group();
        g.userData.part = p;
        root.add(g);
        return [p, g];
      }),
    ) as Record<Part, T.Group>;
    const mats: T.Material[] = [];
    const mat = (color: string, metalness = 0, roughness = 0.45) => {
      const m = new T.MeshStandardMaterial({ color, metalness, roughness });
      mats.push(m);
      return m;
    };
    const metal = mat(
      CASE_COLORS[props.config.finish],
      props.config.material === "aluminium" ? 0.8 : 0.05,
      props.config.material === "aluminium" ? 0.3 : 0.28,
    );
    const dark = mat("#333c39", 0.5, 0.4),
      plateMat = mat("#b8b7aa", 0.65, 0.32),
      pcbMat = mat("#234d43", 0.3, 0.55),
      gold = mat("#d2b777", 0.7, 0.35);
    const capMats = CAP_COLORS[props.config.caps].map((c) =>
      mat(c, 0.02, 0.42),
    );
    const housing = mat("#dee1d1", 0.05, 0.4);
    const stem = mat(SWITCH_COLORS[props.config.switch], 0.1, 0.36);
    function box(
      group: T.Group,
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      m: T.Material,
      r = 0.06,
    ) {
      const obj = new T.Mesh(
        new RoundedBoxGeometry(w, h, d, 2, Math.min(r, h / 3)),
        m,
      );
      obj.position.set(x, y, z);
      obj.castShadow = true;
      obj.receiveShadow = true;
      group.add(obj);
      return obj;
    }
    box(layers.case, width, 0.36, depth, 0, 0, 0, metal, 0.1);
    box(layers.case, width, 0.48, 0.29, 0, 0.35, -depth / 2 + 0.145, metal);
    box(layers.case, width, 0.48, 0.29, 0, 0.35, depth / 2 - 0.145, metal);
    box(
      layers.case,
      0.3,
      0.48,
      depth - 0.58,
      -width / 2 + 0.15,
      0.35,
      0,
      metal,
    );
    box(layers.case, 0.3, 0.48, depth - 0.58, width / 2 - 0.15, 0.35, 0, metal);
    box(layers.case, width - 0.6, 0.07, depth - 0.6, 0, 0.22, 0, dark);
    for (const x of [-width / 2 + 0.7, width / 2 - 0.7])
      for (const z of [-depth / 2 + 0.65, depth / 2 - 0.65]) {
        box(layers.case, 1.1, 0.16, 0.55, x, -0.25, z, dark);
        const screw = new T.Mesh(
          new T.CylinderGeometry(0.065, 0.065, 0.02, 16),
          dark,
        );
        screw.position.set(x, 0.61, z);
        layers.case.add(screw);
      }
    box(
      layers.case,
      0.6,
      0.17,
      0.04,
      -width / 2 + 1.5,
      0.34,
      -depth / 2 - 0.01,
      dark,
      0.02,
    ); // USB-C outline
    box(
      layers.case,
      0.4,
      0.07,
      0.045,
      -width / 2 + 1.5,
      0.34,
      -depth / 2 - 0.02,
      plateMat,
      0.015,
    );
    box(layers.pcb, width - 0.65, 0.09, depth - 0.65, 0, 0.37, 0, pcbMat, 0.04);
    const plateShape = roundShape(width - 0.6, depth - 0.6, 0.12);
    for (const k of keys) {
      const x = k.x - maxX / 2,
        z = k.z - maxZ / 2;
      const hole = new T.Path();
      hole.moveTo(x - 0.32, -z - 0.32);
      hole.lineTo(x - 0.32, -z + 0.32);
      hole.lineTo(x + 0.32, -z + 0.32);
      hole.lineTo(x + 0.32, -z - 0.32);
      hole.closePath();
      plateShape.holes.push(hole);
    }
    const plate = new T.Mesh(
      new T.ExtrudeGeometry(plateShape, {
        depth: 0.08,
        bevelEnabled: false,
        curveSegments: 4,
      }),
      plateMat,
    );
    plate.rotation.x = -Math.PI / 2;
    plate.position.y = 0.58;
    plate.castShadow = true;
    plate.receiveShadow = true;
    layers.plate.add(plate);
    const atlas = document.createElement("canvas");
    atlas.width = 1024;
    atlas.height = 1024;
    const ctx = atlas.getContext("2d")!;
    ctx.clearRect(0, 0, 1024, 1024);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = props.config.caps === "ink" ? "#eff0db" : "#354039";
    const texture = new T.CanvasTexture(atlas);
    texture.colorSpace = T.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const labelMaterial = new T.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    mats.push(labelMaterial);
    const pressMeshes = new Map<string, T.Group>();
    keys.forEach((k, i) => {
      const x = k.x - maxX / 2,
        z = k.z - maxZ / 2;
      const pad = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.012, 10), gold);
      pad.position.set(x - 0.2, 0.425, z);
      layers.pcb.add(pad);
      box(layers.pcb, 0.19, 0.05, 0.09, x + 0.21, 0.445, z + 0.2, dark, 0.01);
      const trace = new T.BufferGeometry().setFromPoints([
        new T.Vector3(x, 0.42, z),
        new T.Vector3(x, 0.42, z + 0.34),
        new T.Vector3(x + 0.35, 0.42, z + 0.34),
      ]);
      layers.pcb.add(
        new T.Line(
          trace,
          new T.LineBasicMaterial({
            color: "#8eac7d",
            transparent: true,
            opacity: 0.6,
          }),
        ),
      );
      box(layers.switches, 0.64, 0.23, 0.64, x, 0.72, z, housing, 0.04);
      box(layers.switches, 0.25, 0.16, 0.09, x, 0.88, z, stem, 0.02);
      box(layers.switches, 0.09, 0.16, 0.25, x, 0.88, z, stem, 0.02);
      if (props.config.switch !== "linear")
        box(
          layers.switches,
          0.08,
          0.11,
          0.3,
          x + 0.22,
          0.87,
          z,
          props.config.switch === "clicky" ? gold : stem,
          0.02,
        );
      const key = new T.Group();
      key.position.set(x, 0, z);
      key.userData.code = k.code;
      layers.caps.add(key);
      pressMeshes.set(k.code, key);
      const geometry = new RoundedBoxGeometry(k.w - 0.09, 0.43, 0.91, 3, 0.075);
      const a = geometry.attributes.position;
      for (let v = 0; v < a.count; v++) {
        const py = a.getY(v),
          factor = 1 - 0.14 * (py / 0.43 + 0.5);
        a.setX(v, a.getX(v) * factor);
        a.setZ(v, a.getZ(v) * factor);
      }
      geometry.computeVertexNormals();
      const cap = new T.Mesh(
        geometry,
        capMats[k.accent ? 2 : k.mod || k.label.length > 1 ? 1 : 0],
      );
      cap.position.y = 1.1;
      cap.castShadow = true;
      cap.receiveShadow = true;
      key.add(cap);
      const col = i % 8,
        row = Math.floor(i / 8);
      ctx.font = `500 ${k.label.length > 2 ? 23 : 34}px Arial`;
      ctx.fillText(k.label, col * 128 + 64, row * 80 + 40);
      const geo = new T.PlaneGeometry(Math.min(k.w - 0.18, 0.76), 0.5);
      const uv = geo.attributes.uv;
      for (let j = 0; j < uv.count; j++)
        uv.setXY(
          j,
          (col * 128 + uv.getX(j) * 128) / 1024,
          1 - (row * 80 + (1 - uv.getY(j)) * 80) / 1024,
        );
      const label = new T.Mesh(geo, labelMaterial);
      label.rotation.x = -Math.PI / 2;
      label.position.set(0, 1.321, 0);
      key.add(label);
    });
    texture.needsUpdate = true;
    box(
      layers.pcb,
      0.65,
      0.1,
      0.55,
      width / 2 - 1,
      0.49,
      -depth / 2 + 0.8,
      dark,
    ); // conceptual controller
    const badge = box(
      layers.case,
      1.5,
      0.025,
      0.25,
      0,
      0.598,
      depth / 2 - 0.18,
      gold,
      0.008,
    );
    badge.userData.part = "case";
    let disposed = false,
      raf = 0,
      frames = 4,
      current = 0,
      lastCommand = -1,
      previousSpread = 0;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const target = new T.Vector3();
    function reset() {
      root.rotation.y = -0.12;
      camera.position.set(7, 14, 20);
      controls.target.set(0, 1, 0);
      controls.update();
    }
    reset();
    function resize() {
      const w = el.clientWidth,
        h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (w / h < 1.25) {
        camera.position.set(7, 18, Math.max(25, 28 / (w / h)));
        controls.maxDistance = 65;
      }
      wake();
    }
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    function render() {
      raf = 0;
      if (disposed) return;
      const p = live.current;
      controls.enableDamping = !reduced.matches;
      const goal = p.explode / 100;
      const moving = Math.abs(current - goal) > 0.0005;
      current = reduced.matches ? goal : T.MathUtils.lerp(current, goal, 0.09);
      const spreadScale = (1 + 0.22 * current) / (1 + 0.22 * previousSpread);
      camera.position
        .sub(controls.target)
        .multiplyScalar(spreadScale)
        .add(controls.target);
      previousSpread = current;
      const offsets = { case: 0, pcb: 1.1, plate: 2.5, switches: 4, caps: 5.8 };
      for (const [name, g] of Object.entries(layers)) {
        g.position.y = offsets[name as Part] * current;
        g.traverse((o) => {
          if (
            o instanceof T.Mesh &&
            o.material instanceof T.MeshStandardMaterial
          ) {
            o.material.emissive.set(p.part === name ? "#182217" : "#000000");
            o.material.emissiveIntensity = 0.25;
          }
        });
      }
      pressMeshes.forEach(
        (mesh, code) => (mesh.position.y = p.pressed.has(code) ? -0.16 : 0),
      );
      if (p.command.id !== lastCommand) {
        lastCommand = p.command.id;
        switch (p.command.action) {
          case "reset":
            reset();
            resize();
            break;
          case "left":
            root.rotation.y -= 0.3;
            break;
          case "right":
            root.rotation.y += 0.3;
            break;
          case "top":
            camera.position.set(0.01, 30, 0.01);
            break;
          case "in":
            camera.position
              .sub(controls.target)
              .multiplyScalar(0.85)
              .add(controls.target);
            break;
          case "out":
            camera.position
              .sub(controls.target)
              .multiplyScalar(1.15)
              .add(controls.target);
            break;
        }
        frames = 12;
      }
      target.set(0, 1 + current * 2, 0);
      controls.target.lerp(target, reduced.matches ? 1 : 0.12);
      const changed = controls.update();
      renderer.render(scene, camera);
      if (!raf && (moving || changed || frames-- > 0))
        raf = requestAnimationFrame(render);
    }
    function wake() {
      frames = 3;
      if (!raf) raf = requestAnimationFrame(render);
    }
    wakeRef.current = wake;
    controls.addEventListener("change", wake);
    const ray = new T.Raycaster();
    const point = new T.Vector2();
    let start = [0, 0];
    function down(e: PointerEvent) {
      start = [e.clientX, e.clientY];
    }
    function up(e: PointerEvent) {
      if (Math.hypot(e.clientX - start[0], e.clientY - start[1]) > 6) return;
      const r = el.getBoundingClientRect();
      point.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        (-(e.clientY - r.top) / r.height) * 2 + 1,
      );
      ray.setFromCamera(point, camera);
      const hit = ray.intersectObject(root, true)[0];
      if (hit) {
        let obj: T.Object3D | null = hit.object;
        while (obj && !obj.userData.part) obj = obj.parent;
        if (obj?.userData.part) live.current.onPart(obj.userData.part);
      }
    }
    function lost(e: Event) {
      e.preventDefault();
      renderer.domElement.style.display = "none";
      setFailed(true);
      live.current.onReady(false);
    }
    renderer.domElement.addEventListener("pointerdown", down);
    renderer.domElement.addEventListener("pointerup", up);
    renderer.domElement.addEventListener("webglcontextlost", lost);
    resize();
    setLoading(false);
    live.current.onReady(true);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      wakeRef.current = () => {};
      observer.disconnect();
      controls.dispose();
      environment.dispose();
      scene.traverse((o) => {
        if (o instanceof T.Mesh || o instanceof T.Line) {
          o.geometry.dispose();
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          ms.forEach((m) => m.dispose());
        }
      });
      texture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [props.config]);
  return (
    <div
      className="scene"
      ref={host}
      data-testid="scene"
      data-layout={props.config.layout}
    >
      {loading && !failed && (
        <div className="scene-message" role="status">
          {props.lang === "ru"
            ? "Собираем вашу клавиатуру…"
            : "Assembling your keyboard…"}
        </div>
      )}
      {failed && (
        <div className="scene-message fallback">
          <span className="eyebrow">2D MODE</span>
          <h2>{props.lang === "ru" ? "3D недоступно" : "3D is unavailable"}</h2>
          <p>
            {props.lang === "ru"
              ? "Настройка, тест и экспорт по-прежнему работают."
              : "Configuration, testing and export still work."}
          </p>
          <div
            className="fallback-board"
            style={{ background: CASE_COLORS[props.config.finish] }}
          >
            {keysFor(props.config.layout).map((k) => (
              <span
                key={k.code}
                style={{
                  left: `${((k.x - k.w / 2 + 0.25) / (props.config.layout === "tkl" ? 19.2 : 16.7)) * 100}%`,
                  top: `${((k.z + 0.25) / (props.config.layout === "65" ? 5.6 : 7)) * 100}%`,
                  width: `${((k.w - 0.1) / (props.config.layout === "tkl" ? 19.2 : 16.7)) * 100}%`,
                  height: `${(0.87 / (props.config.layout === "65" ? 5.6 : 7)) * 100}%`,
                  background:
                    CAP_COLORS[props.config.caps][k.accent ? 2 : k.mod ? 1 : 0],
                  color: props.config.caps === "ink" ? "#eef1df" : "#354039",
                }}
              >
                {k.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
