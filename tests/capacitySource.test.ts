import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DOMParser} from '@xmldom/xmldom';
import {zipSync,unzipSync,strToU8,strFromU8} from 'fflate';
import {fetchCurrentCapacity,capacitySnapshot} from '../src/lib/capacitySource';
import {CAPACITY_SHEET_ID} from '../src/lib/capacityWorkbook';

async function main(){
 const file=process.argv[2];assert.ok(file,'Pass a downloaded capacity XLSX fixture');
 (globalThis as any).DOMParser=DOMParser;
 let now=Date.UTC(2026,9,13),calls=0,fail=false,bytes=new Uint8Array(readFileSync(file));
 Date.now=()=>now;
 globalThis.fetch=(async(url:any,options:any)=>{
  calls++;assert.ok(String(url).includes(CAPACITY_SHEET_ID));assert.equal(options.cache,'no-store');assert.equal(options.credentials,'omit');
  if(fail)throw new Error('offline');
  return {ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)} as Response;
 }) as typeof fetch;
 const a=fetchCurrentCapacity(),b=fetchCurrentCapacity();assert.equal(a,b);
 const initial=await a;assert.ok(initial.totalRows>700);assert.equal(calls,1);
 await fetchCurrentCapacity();assert.equal(calls,1,'coalesces fresh results');
 // Change a cached numeric formula result in the downloaded workbook, as a later export would.
 const files=unzipSync(bytes);let changed=false;
 for(const path of Object.keys(files)){if(!/^xl\/worksheets\//.test(path))continue;const xml=strFromU8(files[path]);if(xml.includes('<v>1.275</v>')){files[path]=strToU8(xml.replaceAll('<v>1.275</v>','<v>1.5</v>'));changed=true;}}
 assert.ok(changed);bytes=zipSync(files);now+=60000;
 const refreshed=await fetchCurrentCapacity();assert.equal(calls,2);assert.notDeepEqual(refreshed,initial,'new export replaces old values');
 fail=true;now+=60000;await assert.rejects(fetchCurrentCapacity());assert.equal(capacitySnapshot().data,refreshed,'offline retains only last successful NEW source');assert.ok(capacitySnapshot().error);assert.equal(capacitySnapshot().loading,false);
 fail=false;now+=60000;await fetchCurrentCapacity();assert.equal(capacitySnapshot().error,'');assert.equal(calls,4);
 console.log('Capacity refresh: new source, concurrent calls, fresh cache, changed workbook, offline preservation and recovery passed');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
