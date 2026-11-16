export const categories=['Electronics','Computer accessories','Phones','Keys','Bags','Wallets & cards','Documents','Books & stationery','Bottles & tiffins','Clothing','Jewellery','Sports & music','Other'];
export const sensitiveCategories=['Electronics','Phones','Keys','Wallets & cards','Documents','Jewellery'];
export const questions={
 'Computer accessories':['A hidden mark, initial or repair','Your matching receiver, accessory or another distinguishing detail'],
 Electronics:['Unique serial number, if you have it','A mark, accessory or feature not shown publicly'],
 Phones:['Unique serial number / IMEI, if you have it','Case details or a private identifying feature'],
 Keys:['Vehicle registration or relevant lock details','Key arrangement or keychain detail not shown publicly'],
 Bags:['A distinctive item inside the bag','An inner mark, pocket detail or repair'],
 'Wallets & cards':['Name or identifying detail inside','A distinctive item or feature inside'],
 Documents:['Name or identifier on the document','Document type or another private detail'],
 'Books & stationery':['Name or initials inside, if any','Subject, annotations or a distinctive mark'],
 'Bottles & tiffins':['Engraving, initials or an identifying mark','An unpublished detail such as a sticker or damage'],
 Clothing:['Inner label or identifying mark','A repair, embroidery or distinctive detail'],
 Jewellery:['Engraving or identifying detail','A feature not visible in the listing'],
 'Sports & music':['Serial number or identifying mark, if any','A repair, accessory or distinctive detail'],
 Other:['A private identifying detail','Another distinguishing feature']
};
const words=v=>new Set(String(v||'').toLowerCase().match(/[\p{L}\p{N}]{2,}/gu)||[]);
function overlap(a,b) {const x=words(a),y=words(b);return [...x].filter(w=>y.has(w)).length/Math.max(1,Math.min(x.size,y.size));}
export function matchReports(a,b) {
 if(a.type===b.type || a.category!==b.category || a.user_id===b.user_id || a.status!=='open' || b.status!=='open') return null;
 const lost=a.type==='lost'?a:b,found=a.type==='found'?a:b;
 const days=(new Date(found.occurred_at)-new Date(lost.occurred_at))/86400000;
 if(days < -2 || days>120) return null;
 let score=30;const reasons=['Same category'];
 const text=overlap(`${a.title} ${a.description}`,`${b.title} ${b.description}`);
 score+=Math.min(35,text*45);if(text>0.15)reasons.push('Similar description');
 const place=overlap(a.location,b.location);score+=Math.min(20,place*25);if(place>0)reasons.push('Related location');
 if(days>=-1&&days<=7){score+=15;reasons.push('Compatible dates');}else if(days<=30){score+=8;reasons.push('Within the same month');}
 if(score<55)return null;
 return {score:Math.round(score),reasons};
}
