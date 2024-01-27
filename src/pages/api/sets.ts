import type { NextApiRequest, NextApiResponse } from 'next'
import mtgSets from '@data/sets.json'
import { DateTime } from 'luxon';
import { TSet } from '@/types/set'

type ResponseData = {
  data?: TSet[]
  message?: string
}

const sortByRelease = (a: TSet, b: TSet) => {
  const ad = DateTime.fromFormat(a.released_at, 'y-MM-dd')
  const bd = DateTime.fromFormat(b.released_at, 'y-MM-dd')
  return bd.diff(ad).as('days')
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {

  try {
    const response = await fetch('https://api.scryfall.com/sets', { cache: 'force-cache' })
    const data = await response.json()
    res.status(200).json({
      data: data.data.sort(sortByRelease)
    })
  } catch (error) {
    res.status(500).json({ "message": 'nok' })
  }
}
