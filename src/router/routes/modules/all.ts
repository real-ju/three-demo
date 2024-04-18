import type { RouteRecordRaw } from 'vue-router';

import { asyncViewImport } from '/@/router/helper/asyncViewImport';

const all: RouteRecordRaw[] = [
  {
    path: '/home',
    name: 'home',
    meta: {
      title: 'ThreeJs学习 - 3D城市',
      public: true
    },
    component: asyncViewImport('home/index.vue')
  },
  {
    path: '/test',
    name: 'test',
    meta: {
      title: '测试',
      public: true
    },
    component: asyncViewImport('test/index.vue')
  }
];

export default all;
