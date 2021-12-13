> 最近在开发公众号网页, 所以对授权进行了探索
示例代码: [klren0312/wechatVueHash (github.com)](https://github.com/klren0312/wechatVueHash)


## 1. 官方文档步骤
[1 第一步：用户同意授权，获取code](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_webpage_authorization.html#0)

[2 第二步：通过code换取网页授权access_token](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_webpage_authorization.html#1)

[3 第三步：刷新access_token（如果需要）](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_webpage_authorization.html#2)

[4 第四步：拉取用户信息(需scope为 snsapi_userinfo)](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_webpage_authorization.html#3)

[5 附：检验授权凭证（access_token）是否有效](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_webpage_authorization.html#4)

## 2. 问题
当使用vue的hash路由时, 微信授权重定向到前端时, 会把路由放到url最后, 例如
```
https://open.weixin.qq.com/connect/oauth2/authorize?appid=yourappid&redirect_uri=https%3A%2F%2Fxx.xx.xx%2Fwechat&response_type=code&scope=snsapi_base&state=wechat&connect_redirect=1#wechat_redirect
会变成
https://xx.xx.xx/wechat/?code=091v5v000CeBWM1bGz2005y2Sd3v5v0q&state=wechat#/codePage
```
![hash路由问题](https://upload-images.jianshu.io/upload_images/2245742-d6c0a1e46d22216b.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

## 3. 处理方法
### 1) 方法一
在路由拦截器中截取`#/`后的路由, 重新拼接成正确url, 并使用`location.href`进行跳转
如果想带参, 可以直接放在路由后面或者放在`state`里面
![带参](https://upload-images.jianshu.io/upload_images/2245742-3f9f597b715f47c6.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

**注意**: `redirect_uri`和`state`都得使用`encodeURIComponent`进行编码

当然我们得拿`code` 去后台请求`openId`等参数进行业务开发

路由拦截器中进行路由拼接与code获取请求接口例子(本例子页面参数是从state中获取)
```js
router.beforeEach(async (to, from, next) => {
  const href = window.location.href
  if (href.indexOf('/?code') > -1) {
    const urlArr = href.split('/?')
    const leftUrl = urlArr[0] + '/#/'
    const rightUrlArr = urlArr[1].split('#/')
    const queryObj = {}
    // 获取code和state参数
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
    // 使用微信code请求后台接口拿openId等你业务参数
    getOpenId(queryObj.code)
      .then((res) => res.json())
      .then((res) => {
        if (res.code === 0) {
          // 解码state参数
          const state = decodeURIComponent(queryObj.state)
          // 拼接url, 跳转
          location.href = `${leftUrl}${rightUrlArr[1]}?openid=${res.openid}&state=${state}`
        } else {
          location.href = leftUrl + 'login'
        }
      })
      .catch(() => {
        location.href = leftUrl + 'login'
      })
  } else {
    next()
  }
})
```

### 2) 方法二
授权回调后端接口, 后端获取微信的code重定向给前端, 前端拿url中的code参数再请求后端接口获取openId等

![流程](https://upload-images.jianshu.io/upload_images/2245742-97bfd38f9de21ebf.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

```
# 设置为后台接口地址
https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxd5be0fe8e3c48877&redirect_uri=https%3A%2F%2Fxx.xx.xx%2Fapi%2FgetCode&response_type=code&scope=snsapi_base&state=wechat&connect_redirect=1#wechat_redirect

# 最后跳转地址
https://xx.xx.xx/wechat/#/codePage?code=001sMjFa1F7uhC0lncJa1jHXCs3sMjFa
```

后端nodejs示例代码
```js
const got = require('got')
const express = require('express')
const bodyParser = require('body-parser')
const ioredis = require('ioredis')
const redis = new ioredis()
const app = express()
app.use('/static', express.static('public'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

const appID = ''
const appsecret = ''

const BASEURL = encodeURIComponent('https://xx.xx.xx/wechat')

const BASEURL2 = encodeURIComponent('https://xx.xx.xx/api/getCode')

//设置所有路由无限制访问，不需要跨域
app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  res.header('Access-Control-Allow-Methods', '*')
  next()
})

const SERVERURL = '/api'
// 微信域名校验
app.get(SERVERURL + '/wechat', function(req, res) {
  const { signature, timestamp, nonce, echostr } = req.query
  console.log(req.query)
  const token = 'zzes'
  jsSHA = require('jssha')
  const arr = [token, timestamp, nonce].sort()
  shaObj = new jsSHA(arr.join(''), 'TEXT')
  const currentSign = shaObj.getHash('SHA-1', 'HEX')
  if (currentSign === signature) {
    res.send(echostr)
  } else {
    res.send('')
  }
})

// 获取用户openId
app.post(SERVERURL + '/getOpenId', function(req, res) {
  const { code } = req.body
  const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appID}&secret=${appsecret}&code=${code}&grant_type=authorization_code`
  got(url).then(data => {
    const result = JSON.parse(data.body)
    if (result?.openid) {
      console.log('openid:' + result.openid)
      res.send({
        code: 0,
        binding: true,
        openid: result.openid
      })
    } else {
      console.log('err', result)
      res.send({
        code: result.errcode,
        binding: false,
        openid: '',
        msg: result.errmsg
      })
    }
  }).catch(err => {
    res.send({
      code: -1,
      binding: false,
      openid: '',
      msg: err.message
    })
  })
})

// 后端拿code, 这里授权域名得配后台的域名
app.get(SERVERURL + '/getCode', async function(req, res) {
  const { code } = req.query
  console.log(req.query)
  res.redirect(`${decodeURIComponent(BASEURL)}/#/codePage?code=${code}`)
})

// 发送模板消息
app.get(SERVERURL + '/sendMsg', async function(req, res) {
  const { openid } = req.query
  const result = await sendTemplateMsg(openid)
  res.send(result)
})

//端口：18888
var server = app.listen(28848, function() {
  console.log("127.0.0.1:28848")
})

// 创建菜单
setWechatMenu()
async function setWechatMenu() {
  const state = `wechat`
  const menu = {
    button: [
      {
        name: '菜单',
        sub_button: [
          {	
            type:'view',
            name:'测试一',
            url:`https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appID}&redirect_uri=${BASEURL}&response_type=code&scope=snsapi_base&state=${state}#wechat_redirect`
          },
          {	
            type:'view',
            name:'测试二',
            url:`https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appID}&redirect_uri=${BASEURL}&response_type=code&scope=snsapi_base&state=${state}#wechat_redirect`
          },
          {	
            type:'view',
            name:'测试',
            url:`https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appID}&redirect_uri=${BASEURL2}&response_type=code&scope=snsapi_base&state=${state}#wechat_redirect`
          }
        ]
      }
    ]
  }
  let accessToken = await redis.get('access_token')
  if (!accessToken) {
    accessToken = await getAccessToken()
  }
  got({
    url: `https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${accessToken}`,
    method: 'POST',
    body: JSON.stringify(menu)
  }).then(data => {
    const result = JSON.parse(data.body)
    console.log('菜单', result)
  })
}

/**
 * 发送模板消息
 */
async function sendTemplateMsg(openid) {
  let accessToken = await redis.get('access_token')
  if (!accessToken) {
    accessToken = await getAccessToken()
  }
  const state = encodeURIComponent(`wechat&id=${Math.floor(Math.random() * 100)}`)
  return got({
    url: `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`,
    method: 'POST',
    body: JSON.stringify({
      touser: openid,
      template_id: '',
      url: `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appID}&redirect_uri=${BASEURL}&response_type=code&scope=snsapi_base&state=${state}#wechat_redirect`,
      data: {
        time: {
          value: new Date().toLocaleString(),
          color: '#323232'
        },
        content: {
          value: '您有新的消息, 请点击查看',
          color: '#ff0000'
        }
      }
    })
  }).then(data => {
    const result = JSON.parse(data.body)
    return result
  })
}

/**
 * 获取access_token
 */
function getAccessToken() {
  return got(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appID}&secret=${appsecret}`)
    .then(data => {
      console.log(data.body)
      const result = JSON.parse(data.body)
      if (result?.access_token) {
        redis.set('access_token', result.access_token, 'EX', result.expires_in - 60)
        return result.access_token
      } else {
        console.log('err', result)
        return ''
      }
    })
    .catch(err => {
      console.log(err)
      return ''
    })
}
```

## 示例测试公众号
![image.png](https://upload-images.jianshu.io/upload_images/2245742-546307ab126b56e6.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)







