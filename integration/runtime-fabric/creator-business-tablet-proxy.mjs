/*
LEEWAY HEADER — DO NOT REMOVE
REGION: LEEWAY.TABLET.RUNTIME_CREATOR_BUSINESS_PROXY
TAG: LEEWAY.TABLET.ORIGINAL_CREATOR_BUSINESS_SERVER_PROXY_V1
5WH:
WHAT = Proxy the Creator Tablet CRM/ERP fleet read to one configured original Runtime HTTPS authority.
WHY = Keep Zitadel bearer tokens server-side, never inside browser extension, localStorage or customer HTML.
WHO = Existing authenticated Tablet host and original Runtime; outside contributor is NOT Agent Lee.
WHERE = integration/runtime-fabric/creator-business-tablet-proxy.mjs in Leeway-Agent-Virtual-Tablet.
WHEN = 2026-11-24.
HOW = Exact path, trusted configured HTTPS origin, 6s timeout, bounded JSON and no redirect/cache; no second issuer.
LICENSE = Existing repository terms.
*/
const error=code=>{const e=new Error('LEEWAY_CREATOR_BUSINESS_'+code);e.code=e.message;return e};
const validCursor=value=>value===null||typeof value==='string'&&/^[A-Za-z0-9_-]{8,128}$/.test(value);
const privateHost=host=>host==='localhost'||host.endsWith('.localhost')||
 host.endsWith('.local')||host==='0.0.0.0'||host==='[::1]'||
 /^127\./.test(host)||/^(10|192\.168|169\.254)\./.test(host)||
 /^172\.(1[6-9]|2[0-9]|3[01])\./.test(host);
export function resolveOriginalCreatorBusinessUrl(origin,cursor=null){
 if(!validCursor(cursor))throw error('PAGE_CURSOR_INVALID');
 let parsed;
 try{parsed=new URL(origin)}catch{throw error('ORIGINAL_RUNTIME_ORIGIN_UNBOUND')}
 if(parsed.protocol!=='https:'||privateHost(parsed.hostname.toLowerCase())||
   parsed.username||parsed.password||parsed.search||parsed.hash||
   parsed.pathname!=='/'||!parsed.hostname.includes('.'))
   throw error('ORIGINAL_RUNTIME_ORIGIN_INVALID');
 parsed.pathname='/api/creator/business/overview';
 if(cursor)parsed.searchParams.set('cursor',cursor);
 return parsed.toString();
}
export function createOriginalCreatorBusinessTabletProxy({fetchImpl=fetch,timeoutMs=6000}={}){
 if(typeof fetchImpl!=='function'||!Number.isInteger(timeoutMs)||timeoutMs<250||timeoutMs>10000)
   throw error('PROXY_DEPENDENCIES_INVALID');
 return Object.freeze({
  async read({origin,bearer,cursor=null}={}){
   if(typeof bearer!=='string'||bearer.length<32||bearer.length>8192||
      !/^[A-Za-z0-9._~+/=-]+$/.test(bearer))
     throw error('SIGNED_ZITADEL_SESSION_REQUIRED');
   const url=resolveOriginalCreatorBusinessUrl(origin,cursor);
   const controller=new AbortController();
   const timer=setTimeout(()=>controller.abort(),timeoutMs);
   try{
     const response=await fetchImpl(url,{
       method:'GET',headers:{authorization:'Bearer '+bearer,accept:'application/json'},
       redirect:'error',cache:'no-store',referrerPolicy:'no-referrer',
       signal:controller.signal
     });
     if(response.status===401||response.status===403)
       throw error('RUNTIME_CREATOR_SCOPE_DENIED');
     if(!response.ok||response.redirected||
        !String(response.headers?.get?.('content-type')||'').toLowerCase().includes('application/json')||
        new URL(response.url).origin!==new URL(url).origin)
       throw error('RUNTIME_READBACK_UNAVAILABLE');
     const text=await response.text();
     if(text.length>128*1024)throw error('RUNTIME_READBACK_OVERSIZED');
     let parsed;try{parsed=JSON.parse(text)}catch{throw error('RUNTIME_READBACK_INVALID_JSON')}
     return parsed;
   }finally{clearTimeout(timer);}
  }
 });
}
