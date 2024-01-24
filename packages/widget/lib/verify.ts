type ResultBody = {
  code: number
  msg: string
  data: any
  timestamp: number
}

export async function verifyKYCWithZkMeServices (appId: string, userAccount: string): Promise<boolean> {
  return fetch('https://nest-api.zk.me/api/grant/check_v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      appId,
      userAccount
    })
  })
    .then(res => {
      if (res.ok) return res.json()
      else {
        throw new Error(`${res.status} ${res.statusText}`)
      }
    })
    .then((result: ResultBody) => {
      if (result.code === 80000000) {
        return result.data.isGrant
      } else {
        return Promise.reject(result)
      }
    })
    .catch((error) => {
      throw error
    })
}

export async function verifyWithZkMeServices (appId: string, userAccount: string, lv: 'zkKYC' | 'Anti-Sybil' = 'zkKYC'): Promise<boolean> {
  const API_URL = lv === 'Anti-Sybil'
    ? 'https://popupapi.zk.me/appUserGrantMch/queryBindingMeId'
    : 'https://nest-api.zk.me/api/grant/check_v2'
  const data = {
    [lv === 'Anti-Sybil' ? 'mchNo' : 'appId']: appId,
    userAccount
  }

  return fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
    .then(res => {
      if (res.ok) return res.json()
      else {
        throw new Error(`${res.status} ${res.statusText}`)
      }
    })
    .then((result: ResultBody) => {
      if (result.code === 80000000) {
        return lv === 'Anti-Sybil' ? result.data : result.data.isGrant
      } else {
        return Promise.reject(result)
      }
    })
    .catch((error) => {
      throw error
    })
}
