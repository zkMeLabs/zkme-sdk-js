import type { KybVerificationOptions } from "..";

type ResultBody = {
  code: number;
  msg: string;
  data: any;
  timestamp: number;
};

export async function verifyKybWithZkMeServices(
  appId: string,
  externalID: string,
  accessToken: string,
  options?: KybVerificationOptions
): Promise<{
  verifyTimeAsIso: string | null;
  status: number;
  statusDesc: string;
}> {
  const API_URL = options?.endpoint
    ? new URL("api/kyb/getBusinessStatus", options?.endpoint).href
    : "https://test-agw.zk.me/kybpopup/api/kyb/getBusinessStatus";
  const data = {
    programNo: options?.programNo,
    accessToken,
    mchNo: appId,
    externalID,
  };

  return fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-test": "true",
    },
    body: JSON.stringify(data),
  })
    .then((res) => {
      if (res.ok) return res.json();
      else {
        throw new Error(`${res.status} ${res.statusText}`);
      }
    })
    .then((result: ResultBody) => {
      if (result.code === 80000000) {
        const { verifyTime } = result.data;
        return {
          verifyTimeAsIso: verifyTime
            ? new Date(verifyTime).toISOString()
            : null,
          status: result.data.statusCode,
          statusDesc: result.data.statusDesc,
        };
      } else {
        return Promise.reject(result);
      }
    })
    .catch((error) => {
      throw error;
    });
}
