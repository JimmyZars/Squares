// Cryptographically secure Fisher–Yates shuffle, unbiased via crypto.randomInt.
const { randomInt } = require('node:crypto');
const Pool = require('./models/Pool');
function permutation() {
  const values = Array.from({length:10}, (_,i)=>i);
  for (let i=values.length-1; i>0; i--) {
    const j=randomInt(i+1);
    [values[i],values[j]]=[values[j],values[i]];
  }
  return values;
}
// Atomic compare-and-set: only one request can finalize a pool.
async function finalizeDuePool(id) {
  return Pool.findOneAndUpdate(
    {_id:id, numbersLockedAt:null, numbersLockAt:{$lte:new Date()}},
    {$set:{rows:permutation(),cols:permutation(),numbersLockedAt:new Date()}},
    {new:true}
  );
}
async function finalizeDuePools() {
  // Iterate in batches so a single login finalizes all currently due pools.
  // Each pool update is atomic; concurrent logins cannot reshuffle it.
  let processed = 0;
  while (true) {
    const due = await Pool.find({numbersLockedAt:null,numbersLockAt:{$lte:new Date()}})
      .select('_id').limit(100).lean();
    if (!due.length) break;
    const results = await Promise.all(due.map(p=>finalizeDuePool(p._id)));
    processed += results.filter(Boolean).length;
    if (results.every(result=>!result)) break;
  }
  return processed;
}
module.exports={finalizeDuePool,finalizeDuePools};
