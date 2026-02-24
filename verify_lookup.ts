
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

const { Schema } = mongoose;

async function run() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  await mongoose.connect(uri);

  const GroupSchema = new Schema({
    name: String,
    bigData: String
  });
  const Group = mongoose.model('Group', GroupSchema);

  const PassageSchema = new Schema({
    group: { type: Schema.Types.ObjectId, ref: 'Group' }
  });
  const Passage = mongoose.model('Passage', PassageSchema);

  const g1 = await Group.create({ name: 'G1', bigData: 'HUGE_DATA' });
  await Passage.create({ group: g1._id });

  // Aggregation 1: Incorrect syntax?
  const res1 = await Passage.aggregate([
    {
      $lookup: {
        from: 'groups',
        localField: 'group',
        foreignField: '_id',
        pipeline: [
          { $project: { name: 1 } } // Exclude bigData
        ],
        as: 'group'
      }
    }
  ]);

  console.log('Result 1:', JSON.stringify(res1, null, 2));

  // Aggregation 2: Correct syntax with let
  const res2 = await Passage.aggregate([
    {
      $lookup: {
        from: 'groups',
        let: { groupId: '$group' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$groupId'] } } },
          { $project: { name: 1 } }
        ],
        as: 'group'
      }
    }
  ]);

  console.log('Result 2:', JSON.stringify(res2, null, 2));

  await mongoose.disconnect();
  await mongod.stop();
}

run().catch(console.error);
