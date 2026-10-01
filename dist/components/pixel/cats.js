import {catAsset,moodCatVariant,weatherCatVariant} from './cat-assets.js';

// One blue-golden shorthair palette and silhouette; expressions only change facial features.
const face=(m='calm')=>`<path fill="#343d57" d="M7 4h6v3h14V4h6v4h2v6h2v12h-2v4h-4v3H11v-2H7v-3H4V15h1V8h2z"/><path fill="#7788a3" d="M8 6h4v4h16V6h4v7h2v12h-2v4h-5v2H13v-2H8v-4H6V15h2z"/><path fill="#a7b6c8" d="M12 9h16v2h4v6h-3v-3h-5v-2h-9v3h-4v5H8v-7h4z"/><path fill="#c79d70" d="M7 21h5v-3h5v2h7v-2h5v3h5v6h-3v3h-7v2h-9v-2h-5v-3H7z"/><path fill="#ead0a0" d="M12 22h6v-2h5v2h6v6h-4v2H15v-2h-3z"/><path fill="#d6a8a0" d="M9 8h2v4H9zm20 0h2v4h-2z"/><path fill="#56637e" d="M17 11h2v4h-2zm4 0h2v4h-2z"/>${eyes(m)}<path fill="#855b68" d="M18 23h5v2h-1v1h-3v-1h-1z"/><path fill="#303448" d="${m==='happy'?'M16 26h2v2h5v-2h2v3h-2v1h-5v-1h-2z':m==='neutral'?'M17 28h7v1h-7z':m==='sad'||m==='cry'?'M18 27h4v1h2v1h-2v-1h-4v1h-2v-1h2z':'M20 26h1v2h3v1h-3v-1h-1v1h-3v-1h3z'}"/><path fill="#f3dfb9" d="M8 24h6v1H8zm-1 3h7v1H7zm20-3h6v1h-6zm0 3h7v1h-7z"/>`;
function eyes(m){if(m==='happy')return '<path fill="#17253c" d="M11 20v-2h2v-1h3v1h2v2h-2v-1h-3v1zm13 0v-2h2v-1h3v1h2v2h-2v-1h-3v1z"/>';const sleepy=['tired','sleep'].includes(m),low=['sad','cry'].includes(m);return `<path fill="#162139" d="M11 ${sleepy?20:18}h6v${sleepy?2:5}h-6zm13 0h6v${sleepy?2:5}h-6z"/><path fill="#b4cbaa" d="M12 20h3v2h-3zm13 0h3v2h-3z"/>${sleepy?'':`<path fill="#fff2ce" d="M12 18h2v2h-2zm13 0h2v2h-2z"/>`}${m==='angry'?'<path fill="#39475f" d="M10 16h3v1h4v2h-3v-1h-4zm15 1h4v-1h2v2h-4v1h-2z"/>':low?'<path fill="#66738e" d="M10 17h3v1h4v2h-3v-1h-4zm14 1h3v-1h4v2h-4v1h-3z"/>':''}`}
export function catImg(variant='normal',className='cat-png',size=null){
 const dimension=Number.isFinite(Number(size))?` width="${Math.max(1,Math.round(Number(size)))}" height="${Math.max(1,Math.round(Number(size)))}"`:'';
 return `<img class="${className}" src="${catAsset(variant)}"${dimension} alt="" aria-hidden="true" draggable="false">`;
}
export function moodCat(m='calm',size=28){return catImg(moodCatVariant(m),'mood-cat cat-png',size)}
export function diaryCat(mood,size=28){return mood?catImg(moodCatVariant(mood),'diary-cat cat-png',size):catImg('tiny','diary-cat cat-png',size)}
export function weatherCat(mode='normal'){
 if(typeof mode==='boolean')mode=mode?'rain':'normal';
 if(mode!=='cold'&&mode!=='weather-cold')return catImg(weatherCatVariant(mode),'cat-sprite cat-png');
 return `<svg class="cat-sprite legacy-cold-cat" viewBox="0 0 56 66" shape-rendering="crispEdges" role="img" aria-label="英短蓝金天气助手 · cold"><path fill="#454f69" d="M19 43h22v5h3v11h-5v4H17v-3h-5v-5h4v-8h3z"/><path fill="#8190a7" d="M19 46h20v13H18v-5h-3v-3h4z"/><path fill="#ddbd8d" d="M24 47h12v12H24z"/><path fill="#f0d5a6" d="M18 59h9v4H16v-2h2zm17 0h8v4H32v-2h3z"/><g transform="translate(9 17)">${face('calm')}</g><path fill="#b65787" d="M18 47h24v4H29v8h-5v-8h-6z"/><path fill="#ef9eae" d="M19 48h21v1H19zm6 4h2v4h-2z"/></svg>`;
}
