import fs from 'node:fs';
// Shared local HTTP configuration; no authentication or Microsoft state.
export function loadConfig(env=process.env){
 if(env===process.env&&fs.existsSync('.env'))process.loadEnvFile('.env');
 const parsed=new URL(env.APP_ORIGIN||'http://127.0.0.1:8765');
 if(parsed.pathname!=='/'||parsed.search||parsed.hash||parsed.username||parsed.password)throw Error('APP_ORIGIN must be a bare origin');
 if(parsed.protocol!=='https:'&&!(parsed.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(parsed.hostname)))throw Error('HTTP is only allowed on loopback');
 return {origin:parsed.origin,port:Number(env.PORT||parsed.port||8765)};
}
