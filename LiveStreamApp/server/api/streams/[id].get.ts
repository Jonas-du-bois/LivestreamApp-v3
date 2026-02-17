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
      populate: [
        {
          path: 'group',
          model: GroupModel
        },
        {
          path: 'apparatus',
          model: ApparatusModel
        }
      ]
    })

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
