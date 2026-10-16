import {useState} from 'react';
import {UserRound} from 'lucide-react';
import type {OnlineUsersSummary} from '../lib/api';
export function OnlineUsersBadge({count,users,updatedAt,stale}:{count:number;users:NonNullable<OnlineUsersSummary['users']>;updatedAt:string;stale:boolean}){
 const [open,setOpen]=useState(false);
 return <div className="online-users-wrap" onMouseEnter={()=>setOpen(true)} onMouseLeave={e=>{if(!e.currentTarget.contains(document.activeElement))setOpen(false);}} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false);}} onKeyDown={e=>{if(e.key==='Escape')setOpen(false);}}>
  <button type="button" className="online-users-badge" aria-expanded={open} aria-controls="online-users-popup" onFocus={()=>setOpen(true)} onClick={()=>setOpen(true)} aria-label={'ผู้ใช้ออนไลน์ / Online users: '+count}>
   <UserRound size={17}/><span>ออนไลน์</span><strong>{count.toLocaleString('th-TH')}</strong><small>คน</small>
  </button>
  {open&&<section id="online-users-popup" className="online-users-popup" aria-label="รายชื่อผู้ใช้ออนไลน์ / Online user list">
   <strong>ผู้ใช้ออนไลน์ / Online Users</strong>
   {stale&&<p className="online-users-warning">อัปเดตไม่สำเร็จ แสดงข้อมูลล่าสุดที่ได้รับ / Update failed; showing last known users.</p>}
   {users.length?<ul>{users.map((user,i)=><li key={user.clientId||i}><span className="online-user-dot" aria-hidden="true"/><div><strong>{user.displayName||user.username||'ไม่ระบุชื่อ / Unnamed'}</strong>{user.username&&<small>@{user.username}</small>}</div></li>)}</ul>:<p>{updatedAt?'ยังไม่มีรายชื่อจากระบบ / No user details available':'กำลังโหลดรายชื่อ / Loading users…'}</p>}
   <small>กิจกรรมในช่วง 2 นาทีล่าสุด / Active in the last 2 minutes</small>
   {updatedAt&&<small>อัปเดตล่าสุด / Updated: {new Date(updatedAt).toLocaleTimeString('th-TH')}</small>}
  </section>}
 </div>;
}
