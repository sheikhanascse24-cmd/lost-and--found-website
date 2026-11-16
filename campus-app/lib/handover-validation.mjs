export const normalizeCollectionCode=value=>String(value||'').replace(/[\s-]/g,'').toUpperCase();
export function approvalIssues(values){
 const issues=[];
 if(!values.verification_method)issues.push('Choose the ownership check you performed.');
 if(String(values.checks||'').trim().length<15)issues.push('Describe the actual checks in at least 15 characters. “Yes” alone does not describe the check.');
 if(!values.identity_checked)issues.push('Confirm that you checked the claimant’s identity.');
 if(!values.evidence_checked)issues.push('Confirm that you assessed evidence connecting the claimant to this item.');
 if((values.sensitive||values.on_hold)&&!values.is_staff)issues.push('Authorized staff must approve this sensitive or held item.');
 if(values.serial_match===false){
  if(!values.is_staff)issues.push('A serial-number conflict requires authorized staff review.');
  else if(!values.discrepancy_resolved||String(values.discrepancy_note||'').trim().length<20||values.verification_method==='unique_identifier')issues.push('Resolve the serial conflict through a separate check and describe the resolution in at least 20 characters.');
 }
 return issues;
}
export function handoverIssues(values){
 const issues=[];
 for(const [field,label] of [['recipient_name','recipient’s name'],['department','recipient’s department'],['campus_id','recipient’s campus identifier'],['collection_place','handover location']]){
  if(String(values[field]||'').trim().length<2)issues.push({field,message:`Enter the ${label} (at least 2 characters).`});
 }
 if(!values.identity_method)issues.push({field:'identity_method',message:'Choose the identity document you checked in person.'});
 if(!/^[A-F0-9]{16}$/.test(normalizeCollectionCode(values.code)))issues.push({field:'code',message:'Use the recipient’s generated 16-character collection code from their approved claim. Do not create your own code.'});
 if(!values.identity_checked)issues.push({field:'identity_checked',message:'Confirm that the person collecting matches the approved account.'});
 return issues;
}
