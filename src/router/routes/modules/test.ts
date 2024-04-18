import type { RouteRecordRaw } from 'vue-router';

import { asyncViewImport } from '/@/router/helper/asyncViewImport';

const test: RouteRecordRaw[] = [
  {
    path: '/test',
    name: 'test',
    meta: {
      title: '测试',
      public: true
    },
    component: asyncViewImport('test/index.vue')
  },
  {
    path: '/test2',
    name: 'test2',
    meta: {
      title: '测试2',
      public: true
    },
    component: asyncViewImport('test2/index.vue')
  }
];

export default test;
