import assert from 'node:assert/strict';
import {DOMParser} from '@xmldom/xmldom';
import {parseToolingHtml,combineTooling,TOOLING_SHEETS} from '../src/lib/tooling';
const sheet=TOOLING_SHEETS[0];
const html=`<html><body><table><tr><th id="${sheet.gid}R2"/><td>SL.NO</td><td>Part Picture</td><td>Part Name</td><td>Part No.</td></tr><tr><th id="${sheet.gid}R3"/><td>1</td><td/><td>Part<br/>Name</td><td>001</td></tr><tr><th id="${sheet.gid}R4"/><td>2</td><td/><td/><td/></tr></table><div id="embed_1"><img src="https://docs.google.com/sheets-images-rt/test"/></div><script>posObj('${sheet.gid}', 'embed_1', 3, 1, 0, 0);</script></body></html>`;
const data=parseToolingHtml(html,sheet,s=>new DOMParser().parseFromString(s,'text/xml') as any);
assert.equal(data.records.length,1);assert.equal(data.records[0].sourceRow,4);assert.equal(data.records[0].values['Part No.'],'001');assert.equal(data.records[0].values['Part Name'],'Part\nName');assert.equal(data.records[0].images.length,1);assert.equal(data.records[0].year,'2024');
assert.equal(combineTooling([data,data]).records.length,2,'retain independent source records rather than deduplicate parts');
assert.throws(()=>parseToolingHtml('<html/>',sheet,s=>new DOMParser().parseFromString(s,'text/xml') as any));
console.log('Tooling HTML parsing and image anchor tests passed');

const merged=html.replace('<td>Part<br/>Name</td><td>001</td>','<td rowspan="2">Part<br/>Name</td><td rowspan="2">001</td>').replace('<td>2</td><td/><td/><td/>','<td/><td/>');
assert.equal(parseToolingHtml(merged,sheet,s=>new DOMParser().parseFromString(s,'text/xml') as any).records.length,1,'blank merged continuation must not create a duplicate record');
