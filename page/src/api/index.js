const BASEURL = 'https://xx.xx.xx/api'

// 获取openid
export function getOpenId(code) {
  return fetch(`${BASEURL}/getOpenId`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: code,
    }),
  })
}

export function sendMsg(openid) {
  return fetch(`${BASEURL}/sendMsg?openid=${openid}`)
}
