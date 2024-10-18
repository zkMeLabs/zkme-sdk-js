import type { KycVerificationOptions, MeIdVerificationOptions } from ".."

type ResultBody = {
  code: number
  msg: string
  data: any
  timestamp: number
}

export async function verifyWithZkMeServices (appId: string, userAccount: string, programNo?: string, lv: 'zkKYC' | 'MeID' = 'zkKYC'): Promise<boolean> {
  const API_URL = lv === 'MeID'
    ? 'https://popupapi.zk.me/appUserGrantMch/queryBindingMeId'
    : 'https://nest-api.zk.me/api/grant/check_v2'
  const data = {
    userAccount,
    ...(
      lv === 'MeID' ? { mchNo: appId } : { programNo, appId }
    )
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
        return lv === 'MeID' ? result.data : result.data.isGrant
      } else {
        return Promise.reject(result)
      }
    })
    .catch((error) => {
      throw error
    })
}

export async function verifyKycWithZkMeServices (appId: string, userAccount: string, options?: KycVerificationOptions): Promise<{
  isGrant: boolean
  verifyTime: number | null
  verifyTimeAsIso: string | null
  programNo: string
}> {
  const API_URL = options?.endpoint
    ? new URL('api/grant/check_v2', options?.endpoint).href
    : 'https://nest-api.zk.me/api/grant/check_v2'
  const data = {
    userAccount,
    programNo: options?.programNo,
    appId
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
        const { verifyTime } = result.data
        return {
          // status: isGrant ? 'matching' : 'mismatch',
          // associatedAccount: isGrant ? userAccount : null,
          verifyTimeAsIso: verifyTime ? new Date(verifyTime).toISOString() : null,
          // programNo: options?.programNo || null,
          ...result.data
        }
      } else {
        return Promise.reject(result)
      }
    })
    .catch((error) => {
      throw error
    })
}

export async function verifyMeidWithZkMeServices (appId: string, userAccount: string, options?: MeIdVerificationOptions): Promise<{
  isGrant: boolean
}> {
  const API_URL = options?.endpoint
    ? new URL('appUserGrantMch/queryBindingMeId', options.endpoint)
    : 'https://popupapi.zk.me/appUserGrantMch/queryBindingMeId'
  const data = {
    userAccount,
    mchNo: appId
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
        return {
          isGrant: result.data,
          // associatedAccount: result.data ? userAccount : null
        }
      } else {
        return Promise.reject(result)
      }
    })
    .catch((error) => {
      throw error
    })
}
