import type { NextApiRequest, NextApiResponse } from 'next'
import mtgSets from '@data/sets.json'
import { DateTime } from 'luxon';
import { TSet } from '@/types/set'
import axios from 'axios'
import https from 'https'

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

type ResponseData = {
  message?: string
}

const imageCheck = async (url: string) => {
  return await axios({
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'X-Requested-With': 'XMLHttpRequest'
    },
    url,
    method: 'GET',
    responseType: 'stream',
    timeout: 2000,
    httpsAgent,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {

  const base = `https://gatherer.wizards.com/Handlers/Image.ashx?type=symbol&set=${req.query.set}&rarity=${req.query.rarity}`

  try {

    const largeResponse = await imageCheck(`${base}&size=large`)
    const largeCheck = parseInt(largeResponse.headers['content-length'], 10)
    if (largeCheck === 0) {
      const mediumResponse = await imageCheck(`${base}&size=medium`)
      const mediumCheck = parseInt(mediumResponse.headers['content-length'], 10)

      if (mediumCheck > 0) {
        res
          .setHeader('Content-Type', 'image/jpeg')
          .setHeader('Content-Length', mediumResponse.headers['content-length'])
          .status(200)
          .send(mediumResponse.data)
        return
      }
    } else {
      res
        .setHeader('Content-Type', 'image/jpeg')
        .setHeader('Content-Length', largeResponse.headers['content-length'])
        .status(200)
        .send(largeResponse.data)
      return
    }
    res
      .setHeader('Content-Type', 'image/jpeg')
      .setHeader('Content-Length', 0)
      .status(200)
      .send('')
  } catch (error) {
    res.status(500).json({ message: 'nok' })
  }
}
