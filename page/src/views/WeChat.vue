//
https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxd5be0fe8e3c48877&redirect_uri=http://1660-36-7-87-91.ngrok.io&response_type=code&scope=snsapi_base&state=wechat#wechat_redirect
<template>
  <div>
    <button @click="send">发送模板消息</button>
  </div>
</template>
<script>
import { sendMsg } from '@/api'
export default {
  name: 'WeChat',
  data() {
    return {}
  },
  methods: {
    send() {
      console.log(this.$route.query.openid)
      sendMsg(this.$route.query.openid)
        .then((res) => res.json())
        .then((res) => {
          console.log(res)
        })
    },
  },
}
</script>
<style lang="scss"></style>
