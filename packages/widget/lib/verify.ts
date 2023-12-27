type ResultBody = {
  code: number
  msg: string
  data: any
  timestamp: number
}

export async function verifyKYCWithZkMeServices (appId: string, userAccount: string): Promise<boolean> {
  return fetch('https://nest-api.zk.me/api/grant/check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      appId,
      walletAddress: userAccount
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
