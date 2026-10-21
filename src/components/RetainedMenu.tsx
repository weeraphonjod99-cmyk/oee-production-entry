import {useRef,type ReactNode} from 'react';
// Keep visited screens mounted in memory. Reloading or signing out clears them.
export function RetainedMenu({active,children}:{active:boolean;children:ReactNode}){const saved=useRef<ReactNode>(null);if(active)saved.current=children;return <div hidden={!active} style={{display:active?'contents':'none'}} data-retained-menu="true">{saved.current}</div>;}
