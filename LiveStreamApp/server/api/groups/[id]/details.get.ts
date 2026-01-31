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

    // Collect unique monitors
    const monitorsSet = new Set<string>()

    const timeline = passages.map((p: any) => {
      if (p.status === 'FINISHED' && typeof p.score === 'number') {
        totalScore += p.score
        finishedCount++
      }
      
      // Add monitors to set
      if (p.monitors && Array.isArray(p.monitors)) {
        p.monitors.forEach((monitor: string) => monitorsSet.add(monitor))
      }

      return {
        _id: p._id,
        apparatus: p.apparatus,
        startTime: p.startTime,
        endTime: p.endTime,
        status: p.status,
        score: p.score,
        monitors: p.monitors || [],
        location: p.location
      }
    })

    const averageScore = finishedCount > 0 ? (totalScore / finishedCount).toFixed(2) : '0.00'

    // 4. Build raw history (combining current passages and archived history)
    const rawHistory: { year: number; score: number; apparatus: string }[] = []

    // From current passages
    passages.forEach((p: any) => {
      if (p.status === 'FINISHED' && typeof p.score === 'number') {
        rawHistory.push({
          year: new Date(p.startTime).getFullYear(),
          score: p.score,
          apparatus: p.apparatus?.code || 'UNK'
        })
      }
    })

    // From group archives
    if (group.history && Array.isArray(group.history)) {
      group.history.forEach((h: any) => {
        rawHistory.push({
          year: h.year,
          score: h.score,
          apparatus: h.apparatusCode
        })
      })
    }

    // Sort by year
    rawHistory.sort((a, b) => a.year - b.year)

    return {
      info: {
        _id: group._id,
        name: group.name,
        canton: group.canton,
        category: group.category || 'ACTIVE', // ACTIVE ou MIXTE
        logo: group.logo,
        description: group.description,
        gymnastsCount: group.gymnastsCount || 0
      },
      stats: {
        completedPassages: finishedCount,
        totalPassages: totalPassages,
        currentTotalScore: Number(averageScore)
      },
      monitors: Array.from(monitorsSet),
      history: rawHistory,
      timeline
    }

  } catch (err: any) {
    console.error('Error fetching group details:', err)
    throw createError({ statusCode: 500, message: err.message })
  }
})