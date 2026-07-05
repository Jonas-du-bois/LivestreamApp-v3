import { defineEventHandler, getRouterParam, createError } from 'h3'
import mongoose from 'mongoose'
import GroupModel from '../../../models/Group'
import PassageModel from '../../../models/Passage'

export default defineEventHandler(async (event) => {
  const groupId = getRouterParam(event, 'id')

  if (!groupId) {
    throw createError({ statusCode: 400, message: 'Group ID is required' })
  }

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    throw createError({ statusCode: 400, message: 'Invalid Group ID format' })
  }

  try {
    // 1. Fetch Group Info
    // ⚡ Bolt: Use exclusive field projection to safely drop heavy arrays without breaking the API contract
    const group = await GroupModel.findById(groupId)
      .select('-history -monitors')
      .lean()

    if (!group) {
      throw createError({ statusCode: 404, message: 'Group not found' })
    }

    // 2. Fetch Timeline (Passages)
    // ⚡ Bolt: Exclude heavy arrays from root passage documents to minimize memory usage
    const passages = await PassageModel.find({ group: groupId })
      .select('-history -monitors')
      .populate('apparatus', 'name icon code')
      .sort({ startTime: 1 })
      .lean()

    // 3. Compute Stats
    let totalScore = 0
    let finishedCount = 0
    let totalPassages = passages.length

    const timeline = passages.map((p: any) => {
      if (p.status === 'FINISHED' && typeof p.score === 'number') {
        totalScore += p.score
        finishedCount++
      }

      return {
        _id: p._id,
        apparatus: p.apparatus,
        startTime: p.startTime,
        endTime: p.endTime,
        status: p.status,
        round: p.round,
        score: p.score,
        location: p.location
      }
    })

    const averageScore = finishedCount > 0 ? (totalScore / finishedCount).toFixed(2) : '0.00'

    return {
      info: {
        _id: group._id,
        name: group.name,
        canton: group.canton,
        category: group.category || 'ACTIFS', // ACTIFS ou MIXTE
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
    throw createError({ statusCode: 500, statusMessage: 'Internal Server Error' })
  }
})
