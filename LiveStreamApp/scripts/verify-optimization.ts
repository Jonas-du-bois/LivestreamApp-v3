import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Define Schemas (Simplified for verification)
const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  history: { type: Array, default: [] }
});
const GroupModel = mongoose.model('Group', GroupSchema);

const ApparatusSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  icon: { type: String }
});
const ApparatusModel = mongoose.model('Apparatus', ApparatusSchema);

const PassageSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
  apparatus: { type: mongoose.Schema.Types.ObjectId, ref: 'Apparatus' },
  startTime: { type: Date }
});
const PassageModel = mongoose.model('Passage', PassageSchema);

const StreamSchema = new mongoose.Schema({
  name: { type: String },
  isLive: { type: Boolean },
  currentPassage: { type: mongoose.Schema.Types.ObjectId, ref: 'Passage' }
});
const StreamModel = mongoose.model('Stream', StreamSchema);

async function main() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  console.log('Connected to InMemory MongoDB');

  // Seed Data
  const history = Array.from({ length: 100 }, (_, i) => ({ year: 2000 + i, score: 9.5 }));
  const group = await GroupModel.create({
    name: 'Test Group',
    description: 'A very long description meant to simulate large payload...'.repeat(100),
    category: 'ACTIFS',
    history
  });

  const apparatus = await ApparatusModel.create({
    name: 'Barres',
    code: 'BA',
    icon: 'fluent:sport-24-regular'
  });

  const passage = await PassageModel.create({
    group: group._id,
    apparatus: apparatus._id,
    startTime: new Date()
  });

  const stream = await StreamModel.create({
    name: 'Main Stream',
    isLive: true,
    currentPassage: passage._id
  });

  console.log('Seeded data created.');

  // Original Query (Baseline)
  const baselineStart = performance.now();
  const baselineResult = await StreamModel.find({ isLive: true })
    .populate({ path: 'currentPassage', populate: ['group', 'apparatus'] })
    .lean();
  const baselineEnd = performance.now();

  const baselineJson = JSON.stringify(baselineResult);
  console.log(`Baseline Payload Size: ${baselineJson.length} bytes`);
  console.log(`Baseline Time: ${(baselineEnd - baselineStart).toFixed(2)}ms`);

  // Optimized Query (Corrected)
  const optimizedStart = performance.now();
  const optimizedResult = await StreamModel.find({ isLive: true })
    .populate({
      path: 'currentPassage',
      // select: 'group apparatus', // REMOVED: Keep full passage doc (startTime, status, etc)
      populate: [
        { path: 'group', select: 'name category' },
        { path: 'apparatus', select: 'name code icon' }
      ]
    })
    .lean();
  const optimizedEnd = performance.now();

  const optimizedJson = JSON.stringify(optimizedResult);
  console.log(`Optimized Payload Size: ${optimizedJson.length} bytes`);
  console.log(`Optimized Time: ${(optimizedEnd - optimizedStart).toFixed(2)}ms`);

  const reduction = baselineJson.length - optimizedJson.length;
  console.log(`Payload Reduction: ${reduction} bytes (${((reduction / baselineJson.length) * 100).toFixed(2)}%)`);

  // Verification
  const optStream = optimizedResult[0] as any;
  const optGroup = optStream.currentPassage.group;

  if (optGroup.history || optGroup.description) {
    console.error('❌ FAILED: Optimized result contains unwanted fields (history/description)');
    process.exit(1);
  }

  if (!optGroup.name || !optGroup.category) {
    console.error('❌ FAILED: Optimized result missing required fields (name/category)');
    process.exit(1);
  }

  if (!optStream.currentPassage.apparatus.code) {
    console.error('❌ FAILED: Optimized result missing apparatus code');
    process.exit(1);
  }

  if (!optStream.currentPassage.startTime) {
    console.error('❌ FAILED: Optimized result missing startTime from currentPassage');
    process.exit(1);
  }

  console.log('✅ SUCCESS: Optimization verification passed.');

  await mongoose.disconnect();
  await mongod.stop();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
