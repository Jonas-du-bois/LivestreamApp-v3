import PassageModel from '../../models/Passage';

/**
 * One-time migration endpoint to update existing passages with round='QUALIFIER'.
 * This ensures data consistency after adding the 'round' field.
 */
export default defineEventHandler(async (event) => {
  try {
    const result = await PassageModel.updateMany(
      { round: { $exists: false } },
      { $set: { round: 'QUALIFIER' } }
    );

    return {
      success: true,
      message: `Migrated ${result.modifiedCount} passages to 'QUALIFIER' round.`,
      result
    };
  } catch (error) {
    console.error('[migration] Round update failed:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Migration failed'
    });
  }
});
