import assert from 'node:assert/strict';
import {compareClaim} from '../lib/claim-assistant.mjs';
const result=await compareClaim({answer1:'Tiny triangle engraved under the base',answer2:'Scratch below the handle',serial:'ABC-123'},{answer1:'A small triangular engraving underneath',answer2:'A scratch under the handle',explanation:'The bottle has those distinguishing physical features.',serial:'ABC123'});
assert.equal(result.mode,'local_model');assert.ok(result.matches.some(m=>m.related));assert.equal(result.serialConflict,false);
const conflict=await compareClaim({answer1:'A tiny triangle on the base',serial:'ABC-123'},{explanation:'A triangle is marked underneath the bottle.',serial:'WRONG-9'});
assert.equal(conflict.serialConflict,true);
console.log('Local AI model loaded. Related descriptions detected. Serial conflict flagged. No ownership decision generated.');
