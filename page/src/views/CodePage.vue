<template>
  <div>
    {{ JSON.stringify($route.query) }}
  </div>
</template>
<script>
import { getOpenId } from '@/api'
export default {
  name: 'CodePage',
  data() {
    return {}
  },
  mounted() {
    console.log(this.$route.query.code)
    getOpenId(this.$route.query.code).then((res) => {
      console.log(res)
    })
  },
}
</script>
<style lang="scss"></style>
