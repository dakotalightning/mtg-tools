import type { NextApiRequest, NextApiResponse } from 'next'
// @ts-ignore
import currencyapi from '@everapi/currencyapi-js'

type ResponseData = {
  message: string
}

const API_KEY = 'cur_live_yKVuID5w4WtXnBH12DVTGantwU1KOX0r4oscMae4'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {

  const client = new currencyapi(API_KEY)

  try {
    const resp = await client.latest({
      base_currency: 'USD',
      currencies: 'CAD'
    })
    // const data = await resp.json()
    res.status(200).json(resp)
  } catch (e) {
    res.status(500).json({ "message": 'nok' })
  }
}
