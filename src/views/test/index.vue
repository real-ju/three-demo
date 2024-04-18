<template>
  <div class="test-page" ref="testPage">
    <div class="building-info-box" ref="buildingInfoBox">
      {{ currentBuilding?.desc }}
    </div>
    <div class="car-color-list" ref="carColorList">
      <div
        class="item"
        v-for="item in carColors"
        :key="item.name"
        :class="item.name === currentCarColor ? [item.name, 'checked'] : [item.name]"
        @click="selectCarColor(item.name)"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import envHdrUrl from '/@/assets/hdr/blouberg_sunrise_2_1k.hdr';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import carGlbUrl from '/@/assets/gltf/lamborghini_gallardo_lp560.glb';
import portalGlbUrl from '/@/assets/gltf/nether_portal.glb';
import anime from 'animejs/lib/anime.es.js';

const testPage = ref();
const buildingInfoBox = ref();
const carColorList = ref();

// 渲染的对象
const objects: Recordable = {
  building: [],
  car: null,
  carBody: [],
  portal: []
};

// 建筑列表
const buildingList = ref<Recordable[]>([
  {
    name: '腾讯大厦',
    desc: '腾讯是一家世界领先的互联网科技公司，用创新的产品和服务提升全球各地人们的生活品质。',
    x: -15,
    z: 5,
    height: 40
  },
  {
    name: '阿里巴巴大厦',
    desc: '阿里巴巴集团由曾担任英语教师的马云与其他来自不同背景的伙伴共18人，于1999年在中国杭州创立。',
    x: 15,
    z: -15,
    height: 50
  },
  {
    name: '字节跳动大厦',
    desc: '字节跳动成立于2012年3月，是最早将人工智能应用于移动互联网场景的科技企业之一。',
    x: 25,
    z: 25,
    height: 30
  }
]);
// 当前选中的建筑名
const currentBuildingName = ref('');
const currentBuilding = computed(() => {
  return buildingList.value.find((item) => {
    return item.name === currentBuildingName.value;
  });
});
const carColors = ref([
  {
    name: 'grey',
    value: 0x6e6e6e
  },
  {
    name: 'red',
    value: 0xea3434
  },
  {
    name: 'blue',
    value: 0x2f51b6
  },
  {
    name: 'yellow',
    value: 0xe6e615
  }
]);
const currentCarColor = ref('grey');

const selectCarColor = (value: string) => {
  currentCarColor.value = value;
  const color = carColors.value.find((item: any) => {
    return item.name === currentCarColor.value;
  });
  objects.carBody.forEach((item: any) => {
    item.material?.color.set(color!.value);
  });
};

onMounted(async () => {
  const hdrLoader = new RGBELoader();
  const gltfLoader = new GLTFLoader();

  // 加载数据
  const envMap = await hdrLoader.loadAsync(envHdrUrl);
  envMap.mapping = THREE.EquirectangularReflectionMapping;
  // 加载跑车
  let carAnimation: any;
  let carRunStatus = false;
  gltfLoader.load(carGlbUrl, (gltf: any) => {
    const carModel = gltf.scene;
    // 设置跑车起点
    carModel.position.x = -50;
    carModel.position.z = -30;
    carModel.scale.set(3, 3, 3);
    carModel.rotateY(Math.PI / 2);
    carModel.traverse((obj: any) => {
      if (obj.isMesh) {
        obj.ancestors = carModel;
        if (
          obj.name === 'gallardo_hood_b_gallardo_paint_0' ||
          obj.name === 'gallardo_body_gallardo_paint_0'
        ) {
          objects.carBody.push(obj);
        }
      }
    });
    scene.add(carModel);
    objects.car = carModel;
    // 创建行驶动画
    const duration = 10000; // ms
    const pathSegCount = 100; // 行驶路径分段数
    const segDuration = duration / pathSegCount; // 每段需要时长
    // 创建汽车行驶路线
    const carPath = createPath([
      [-50, -30],
      [-30, -30],
      [-10, -30],
      [-10, -30],
      [0, -30],
      [0, -20],
      [0, -20],
      [0, 0],
      [0, 30],
      [0, 30],
      [0, 40],
      [10, 40],
      [10, 40],
      [30, 40],
      [50, 40]
    ]);
    if (carPath) {
      const points = carPath.getSpacedPoints(101);
      const tl = anime.timeline({
        easing: 'linear',
        duration: segDuration,
        complete: (anim: any) => {
          tl.restart();
        }
      });
      points.forEach((item, index) => {
        if (index === 0) {
          return;
        }
        const nextPoint = index < points.length - 1 ? points[index + 1] : null;
        tl.add({
          targets: carModel.position,
          x: item.x,
          z: item.y,
          begin: (anim: any) => {
            if (nextPoint) {
              carModel.lookAt(nextPoint.x, 0, nextPoint.y);
            }
          }
        });
      });
      carAnimation = tl;
      carRunStatus = true;
    }
  });
  // 加载传送门
  gltfLoader.load(portalGlbUrl, (gltf: any) => {
    const portalModel1 = gltf.scene;
    portalModel1.children[0].position.set(-4.5, -1.5, 0);
    // 设置传送门位置
    portalModel1.position.x = -51.5;
    portalModel1.position.z = -30;
    portalModel1.scale.set(2, 2, 2);
    portalModel1.rotateY(Math.PI / 2);
    const portalModel2 = portalModel1.clone();
    portalModel2.position.x = 51.5;
    portalModel2.position.z = 40;
    scene.add(portalModel1);
    scene.add(portalModel2);
    objects.portal.push(portalModel1, portalModel2);
  });

  const canvasWidth = testPage.value.clientWidth;
  const canvasHeight = testPage.value.clientHeight;
  const scene = new THREE.Scene();
  scene.background = envMap;
  scene.environment = envMap;
  const camera = new THREE.PerspectiveCamera(75, canvasWidth / canvasHeight, 0.1, 1000);
  camera.position.y = 50;
  camera.position.z = 80;

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(canvasWidth, canvasHeight);
  renderer.shadowMap.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.addEventListener('click', function (event) {
    const eventX = event.offsetX;
    const eventY = event.offsetY;
    // 坐标转换
    const x = (eventX / canvasWidth) * 2 - 1;
    const y = -(eventY / canvasHeight) * 2 + 1;
    selectBuilding(x, y);
    selectCar(x, y);
  });
  testPage.value.appendChild(renderer.domElement);

  // 选中建筑，显示详情弹框
  function selectBuilding(x: number, y: number) {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    const intersects = raycaster.intersectObjects(objects.building);
    if (intersects.length > 0) {
      const intersectObj = (intersects[0].object as any).ancestors;
      if (intersectObj) {
        const building = buildingList.value.find((item) => {
          return item.name === intersectObj.name;
        });
        if (currentBuildingName.value !== intersectObj.name) {
          // 选中
          // 高亮
          outlinePass.selectedObjects = [intersectObj];
          if (currentBuildingName.value !== '') {
            // 清除之前的详情弹窗
            const oldBuilding = objects.building.find((item: any) => {
              return item.name === currentBuildingName.value;
            });
            if (oldBuilding) {
              oldBuilding.getObjectByName(oldBuilding.name + '详情')?.removeFromParent();
            }
          }
          currentBuildingName.value = intersectObj.name;
          // 创建详情弹窗
          if (building) {
            buildingInfoBox.value.className = 'building-info-box show';
            const tag = new CSS2DObject(buildingInfoBox.value);
            tag.name = building.name + '详情';
            tag.position.z = -(building.height / 2);
            intersectObj.add(tag);
          }
        } else {
          // 取消选中
          // 取消高亮
          outlinePass.selectedObjects = [];
          // 清除之前的详情弹窗
          const oldBuilding = objects.building.find((item: any) => {
            return item.name === currentBuildingName.value;
          });
          if (oldBuilding) {
            oldBuilding.getObjectByName(oldBuilding.name + '详情')?.removeFromParent();
          }
          currentBuildingName.value = '';
        }
      }
    }
  }
  // 选中跑车，暂停移动，镜头拉近
  function selectCar(x: number, y: number) {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    const intersects = raycaster.intersectObjects([objects.car]);
    if (intersects.length > 0) {
      const intersectObj = (intersects[0].object as any).ancestors;
      if (intersectObj) {
        if (carRunStatus) {
          carAnimation.pause();
          carRunStatus = false;
          const v3 = new THREE.Vector3();
          intersectObj.getWorldPosition(v3);
          updateCameraWithAnimation(v3.x + 15, v3.y + 10, v3.z + 15, v3.x, v3.y, v3.z);
          // 创建跑车颜色选择框
          carColorList.value.className = 'car-color-list show';
          const tag = new CSS2DObject(carColorList.value);
          tag.name = '颜色选择';
          tag.position.y = 3;
          intersectObj.add(tag);
        } else {
          carAnimation.play();
          carRunStatus = true;
          updateCameraWithAnimation(0, 50, 80, 0, 0, 0);
          intersectObj.getObjectByName('颜色选择')?.removeFromParent();
        }
      }
    }
  }

  // 使用动画更新相机
  function updateCameraWithAnimation(
    pX: number,
    pY: number,
    pZ: number,
    tX: number,
    tY: number,
    tZ: number
  ) {
    anime({
      targets: camera.position,
      x: pX,
      y: pY,
      z: pZ,
      easing: 'linear',
      duration: 1000
    });
    anime({
      targets: orbitControls.target,
      x: tX,
      y: tY,
      z: tZ,
      easing: 'linear',
      duration: 1000
    });
  }

  const css2Renderer = new CSS2DRenderer();
  css2Renderer.setSize(canvasWidth, canvasHeight);
  css2Renderer.domElement.style.position = 'absolute';
  css2Renderer.domElement.style.top = '0px';
  css2Renderer.domElement.style.left = '0px';
  css2Renderer.domElement.style.pointerEvents = 'none';
  testPage.value.appendChild(css2Renderer.domElement);

  // 轨道控制器
  const orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.enableDamping = true;

  // 世界坐标轴
  // const axesHelper = new THREE.AxesHelper(50);
  // scene.add(axesHelper);

  // 世界网格
  // const gridHelper = new THREE.GridHelper(100);
  // scene.add(gridHelper);

  // 添加环境光
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  // 添加太阳光
  const sunLight = new THREE.DirectionalLight(0xffffff, 2);
  sunLight.position.set(-60, 15, -10);
  sunLight.castShadow = true;
  sunLight.shadow.camera.left = -60;
  sunLight.shadow.camera.right = 60;
  sunLight.shadow.camera.top = 50;
  sunLight.shadow.camera.bottom = -20;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 120;
  scene.add(sunLight);

  // 画地面
  drawGround();
  // 画建筑
  buildingList.value.forEach((item) => {
    drawBuilding(item.x, item.z, item.height, item.name);
  });

  // 画地面
  function drawGround() {
    const geometry = new THREE.PlaneGeometry(100, 100);
    const material = new THREE.MeshPhysicalMaterial({ color: 0xd3d3d3, side: THREE.DoubleSide });
    material.metalness = 0;
    material.roughness = 0.9;
    const plane = new THREE.Mesh(geometry, material);
    plane.name = '地面';
    plane.rotateX(Math.PI / 2);
    plane.receiveShadow = true;
    scene.add(plane);
  }

  function createTextCanvas(text: string) {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = '20px 等线';
      ctx.fillStyle = '#00008B';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(text, 100, 100, 200);
    }
    return canvas;
  }

  // 画建筑
  function drawBuilding(x: number = 0, z: number = 0, height: number = 40, name: string) {
    const geometry = new THREE.BoxGeometry(10, 10, height);
    const material = new THREE.MeshPhysicalMaterial({ color: 0xffffff });
    material.metalness = 0.2;
    material.roughness = 0.2;
    const cube = new THREE.Mesh(geometry, material);
    cube.name = name;
    cube.rotateX(Math.PI / 2);
    cube.position.set(x, height / 2, z);
    cube.castShadow = true;
    (cube as any).ancestors = cube;
    // 创建建筑标签
    const canvas = createTextCanvas(name);
    const spriteTexture = new THREE.CanvasTexture(canvas);
    spriteTexture.colorSpace = THREE.SRGBColorSpace;
    const spriteMaterial = new THREE.SpriteMaterial({
      map: spriteTexture
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.z = -(height / 2 + 3);
    sprite.scale.set(20, 20, 1);
    // 用于射线选取
    (sprite as any).ancestors = cube;
    cube.add(sprite);

    scene.add(cube);
    objects.building.push(cube);
  }

  // 使用贝塞尔曲线拼接的路径
  function createPath(points: number[][]) {
    // 验证点数量
    if (points.length % 3 !== 0) {
      return;
    }
    const path = new THREE.CurvePath<THREE.Vector2>();
    points.forEach((item, index) => {
      if (index % 3 === 0) {
        const curve = createBezierCurve([points[index], points[index + 1], points[index + 2]]);
        path.curves.push(curve);
      }
    });
    return path;
  }

  // 创建贝塞尔曲线
  function createBezierCurve(points: number[][]) {
    const v2s = points.map((point) => {
      return new THREE.Vector2(...point);
    });
    const curve = new THREE.QuadraticBezierCurve(...v2s);
    return curve;
  }

  // 后处理
  const composer = new EffectComposer(renderer);
  // 创建renderPass通道
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  // 创建OutlinePass通道
  const v2 = new THREE.Vector2(canvasWidth, canvasHeight);
  const outlinePass = new OutlinePass(v2, scene, camera);
  outlinePass.edgeThickness = 1;
  outlinePass.edgeStrength = 3;
  outlinePass.selectedObjects = [];
  composer.addPass(outlinePass);
  // 颜色校正
  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  function animate() {
    orbitControls.update();
    // renderer.render(scene, camera);
    composer.render();
    css2Renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
});
</script>

<style lang="less" scoped>
.test-page {
  width: 100%;
  height: 100%;
  position: relative;
  .building-info-box {
    display: none;
    width: 150px;
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 10px;
    font-size: 16px;
    line-height: 24px;
    color: #fef9f9;
    padding: 10px 15px;
    pointer-events: auto;
    left: 150px;
    &.show {
      display: block;
    }
  }
  .car-color-list {
    display: none;
    align-items: center;
    pointer-events: auto;
    &.show {
      display: flex;
    }
    .item {
      width: 30px;
      height: 30px;
      background-color: #6e6e6e;
      border: 3px solid #ffffff;
      cursor: pointer;
      &.grey {
        background-color: #6e6e6e;
        border-color: #6e6e6e;
      }
      &.red {
        background-color: #ea3434;
        border-color: #ea3434;
      }
      &.blue {
        background-color: #2f51b6;
        border-color: #2f51b6;
      }
      &.yellow {
        background-color: #e6e615;
        border-color: #e6e615;
      }
      &.checked {
        border-color: #ffffff;
      }
      & + .item {
        margin-left: 20px;
      }
    }
  }
}
</style>
