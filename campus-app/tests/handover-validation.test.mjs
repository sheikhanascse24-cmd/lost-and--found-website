import {test} from 'node:test';import assert from 'node:assert/strict';
import {handoverIssues,normalizeCollectionCode,approvalIssues} from '../lib/handover-validation.mjs';
const valid={recipient_name:'Test Recipient',department:'Computer Science',campus_id:'TEST-01',collection_place:'Reception',identity_method:'College ID checked in person',identity_checked:true,code:'AB1234567890CDEF'};
test('approval explains the exact short-checks failure instead of silently disabling',()=>{
 const decision={verification_method:'alternative',checks:'Yes',identity_checked:true,evidence_checked:true};
 assert.equal(approvalIssues(decision).length,1);assert.ok(approvalIssues(decision)[0].includes('15 characters'));
 assert.deepEqual(approvalIssues({...decision,checks:'Original dongle operates the mouse; hidden A mark checked.'}),[]);
 assert.ok(approvalIssues({...decision,checks:'Original dongle and hidden mark checked.',sensitive:true}).some(v=>v.includes('Authorized staff')));
});
test('handover explains missing fields and a manually invented code',()=>{
 const issues=handoverIssues({...valid,department:'',campus_id:'',identity_method:'',code:'12rr22266ggggggsshhh'});
 assert.deepEqual(issues.map(v=>v.field),['department','campus_id','identity_method','code']);
 assert.ok(issues.find(v=>v.field==='code').message.includes('Do not create your own code'));
});
test('copied codes normalize and collection photos need no separate checkbox',()=>{
 assert.equal(normalizeCollectionCode(' ab12 3456-7890 cdef '),valid.code);
 assert.deepEqual(handoverIssues({...valid,code:' ab12 3456-7890 cdef '}),[]);
 assert.deepEqual(handoverIssues({...valid,handover_image:'fixture'}),[]);
});
