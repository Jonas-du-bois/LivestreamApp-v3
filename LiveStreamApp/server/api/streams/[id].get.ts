import { StreamModel } from '../../models/Stream'
import { PassageModel } from '../../models/Passage'
import { GroupModel } from '../../models/Group'
import { ApparatusModel } from '../../models/Apparatus'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing stream ID',
    })
  }

  try {
    const stream = await StreamModel.findById(id).populate({
      path: 'currentPassage',
      model: PassageModel,
      select: 'startTime endTime location status score group apparatus monitors',
      populate: [
        {
          path: 'group',
          model: GroupModel,
          select: 'name category canton logo description gymnastsCount'
        },
        {
          path: 'apparatus',
          model: ApparatusModel,
          select: 'name code icon'
        }
      ]
    }).lean()

    if (!stream) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Stream not found',
      })
    }

    return stream
  } catch (error: any) {
    console.error('Error fetching stream:', error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error'
    })
  }
})
