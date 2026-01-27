import { defineEventHandler, getRouterParam, createError } from 'h3'
import GroupModel from '../../../models/Group'
import PassageModel from '../../../models/Passage'
import ApparatusModel from '../../../models/Apparatus'

export default defineEventHandler(async (event) => {
  const groupId = getRouterParam(event, 'id')

  if (!groupId) {
    throw createError({ statusCode: 400, message: 'Group ID is required' })
  }

  try {
    // 1. Fetch Group Info
    const group = await GroupModel.findById(groupId).lean()
    if (!group) {
      throw createError({ statusCode: 404, message: 'Group not found' })
    }

    // 2. Fetch Timeline (Passages)
    const passages = await PassageModel.find({ group: groupId })
      .populate('apparatus', 'name icon code')
      .sort({ startTime: 1 })
      .lean()

    // 3. Compute Stats
    let totalScore = 0
    let finishedCount = 0
    let totalPassages = passages.length

    const timeline = passages.map((p: any) => {
      if (p.status === 'FINISHED' && p.scores?.total) {
        totalScore += p.scores.total
        finishedCount++
      }
      return {
        _id: p._id,
        apparatus: p.apparatus,
        startTime: p.startTime,
        endTime: p.endTime,
        status: p.status,
        scores: p.scores,
        monitors: p.monitors || [],
        location: p.location
      }
    })

    const averageScore = finishedCount > 0 ? (totalScore / finishedCount).toFixed(2) : '0.00'

    return {
      info: {
        _id: group._id,
        name: group.name,
        canton: group.canton,
        logo: group.logo,
        description: group.description
      },
      stats: {
        completedPassages: finishedCount,
        totalPassages: totalPassages,
        currentTotalScore: Number(averageScore)
      },
      timeline
    }

  } catch (err: any) {
    console.error('Error fetching group details:', err)
    throw createError({ statusCode: 500, message: err.message })
  }
})
