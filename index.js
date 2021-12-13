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


// https://open.weixin.qq.com/connect/oauth2/authorize?appid=wxd5be0fe8e3c48877&redirect_uri=http://127.0.0.1/test?path=aaa&response_type=code&scope=snsapi_base

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

// 发送模板消息
app.get(SERVERURL + '/sendMsg', async function(req, res) {
  const { openid } = req.query
  const result = await sendTemplateMsg(openid)
  res.send(result)
})

// 后端拿code, 这里授权域名得配后台的域名
app.get(SERVERURL + '/getCode', async function(req, res) {
  const { code } = req.query
  console.log(req.query)
  res.redirect(`${decodeURIComponent(BASEURL)}/#/codePage?code=${code}`)
})

//端口：18888
var server = app.listen(28848, function() {
  console.log("127.0.0.1:28848")
})

// 创建菜单
setWechatMenu()
async function setWechatMenu() {
  const url = encodeURIComponent(`/#/`)
  const menu = {
    button: [
      {
        name: '菜单',
        sub_button: [
          {	
            type:'view',
            name:'测试一',
            url:`https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appID}&redirect_uri=${BASEURL}${encodeURIComponent(`/#/`)}wechat&response_type=code&scope=snsapi_base&state=111#wechat_redirect`
          },
          {	
            type:'view',
            name:'测试二',
            url:`https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appID}&redirect_uri=${BASEURL}${encodeURIComponent(`/#/`)}wechat2&response_type=code&scope=snsapi_base&state=111#wechat_redirect`
          },
          {	
            type:'view',
            name:'测试',
            url:`https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appID}&redirect_uri=${BASEURL2}&response_type=code&scope=snsapi_base&state=111#wechat_redirect`
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
      template_id: 'WfcomWPkkbQlvTJXJpzFVWGc14hOeyI23TXgHPST8-I',
      url: `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appID}&redirect_uri=${BASEURL}${encodeURIComponent(`/#/`)}wechat1&response_type=code&scope=snsapi_base&state=${state}#wechat_redirect`,
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
