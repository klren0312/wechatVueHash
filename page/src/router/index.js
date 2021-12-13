import Vue from 'vue'
import VueRouter from 'vue-router'
import { getOpenId } from '@/api'
Vue.use(VueRouter)

const routes = [
  {
    path: '/error',
    name: 'error',
    component: () =>
      import(/* webpackChunkName: "login" */ '../views/Error.vue'),
  },
  {
    path: '/wechat',
    name: 'wechat',
    component: () =>
      import(/* webpackChunkName: "wechat" */ '../views/WeChat.vue'),
  },
  {
    path: '/wechat2',
    name: 'wechat2',
    component: () =>
      import(/* webpackChunkName: "wechat2" */ '../views/WeChat2.vue'),
  },
  {
    path: '/codePage',
    name: 'codePage',
    component: () =>
      import(/* webpackChunkName: "codePage" */ '../views/CodePage.vue'),
  },
]

const router = new VueRouter({
  // mode: 'history',
  base: process.env.BASE_URL,
  routes,
})

router.beforeEach(async (to, from, next) => {
  const href = window.location.href
  if (href.indexOf('/?code') > -1) {
    const urlArr = href.split('/?')
    const leftUrl = urlArr[0] + '/#/'
    const rightUrlArr = urlArr[1].split('#/')
    const queryObj = {}
    rightUrlArr[0]
      .split('&')
      .map((item) => {
        const splitStr = item.split('=')
        return {
          key: splitStr[0],
          value: splitStr[1],
        }
      })
      .forEach((item) => {
        queryObj[item.key] = item.value
      })
    console.log(rightUrlArr[0])
    const state = decodeURIComponent(queryObj.state)
    getOpenId(queryObj.code)
      .then((res) => res.json())
      .then((res) => {
        if (res.code === 0) {
          location.href = `${leftUrl}${rightUrlArr[1]}?openid=${res.openid}&state=${state}`
        } else {
          location.href = leftUrl + 'login'
        }
      })
      .catch(() => {
        location.href = leftUrl + 'login'
      })
    console.log(queryObj)
  } else {
    next()
  }
})

export default router
