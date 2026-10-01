import {state,esc,currentProfile} from '../../lib/store.js';
import {DEFAULT_UI_TEXT} from '../../data/seed.js';
import {requirement} from '../../lib/progress/model.js';
import {weatherText} from '../../lib/services.js';
import {destinations} from '../hud/home.js';
import {icon} from '../pixel/primitives.js';
import {catImg} from '../pixel/cats.js';

export function profileUiText(){
 const value=state.uiText&&typeof state.uiText==='object'?state.uiText:{};
 return {
  sidebarMotto:String(value.sidebarMotto||DEFAULT_UI_TEXT.sidebarMotto).slice(0,120),
  footerQuote:String(value.footerQuote||DEFAULT_UI_TEXT.footerQuote).slice(0,180)
 };
}

export function globalSidebar(route){
 const name=esc(currentProfile()?.displayName||'Guest'),motto=esc(profileUiText().sidebarMotto),progress=state.playerProgress||{level:1,currentExp:0},needed=requirement(progress.level),percent=Math.max(0,Math.min(100,progress.currentExp/needed*100));
 return `<aside class="side-nav"><a class="home-brand" href="#home">${name}'s home</a><button class="side-profile" data-action="settings" title="Local profile">${name} · LOCAL</button><nav aria-label="城市区域">${destinations.map(([id,en])=>`<a href="#${id}" class="${route===id?'active':''}" ${route===id?'aria-current="page"':''}>${icon(id,32)}<span>${en}</span></a>`).join('')}</nav><div class="side-bottom"><div class="city-thumb" role="img" aria-label="像素赛博城市预览"></div><p class="sidebar-motto">${motto}</p><div class="sidebar-level"><b>LV.${String(progress.level).padStart(2,'0')}</b><span class="sidebar-cat">${catImg('sidebar','cat-sprite cat-png')}</span></div><span class="sidebar-exp-bar" role="progressbar" aria-label="侧栏经验" aria-valuenow="${Math.round(percent)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${percent}%"></i></span></div></aside>`;
}

function weatherKind(code){if(code===0)return'sun';if(code==null||code<4)return'cloud';return'rain'}
export function globalWeather(){
 const weather=state.weather,current=weather?.current;
 if(!current)return `<div class="top-weather">${icon('cloud',22)}<strong>--°C</strong><small>未选择城市</small></div>`;
 return `<div class="top-weather" title="${esc(weather.city)} · ${esc(weatherText(current.weather_code))}">${icon(weatherKind(current.weather_code),22)}<strong>${Math.round(current.temperature_2m)}°C</strong><small>${esc(weather.city)} · ${esc(weatherText(current.weather_code))}</small></div>`;
}

export function globalExp(){
 const progress=state.playerProgress||{level:1,currentExp:0},needed=requirement(progress.level),percent=Math.max(0,Math.min(100,progress.currentExp/needed*100));
 return `<div class="top-exp"><b>LV.${String(progress.level).padStart(2,'0')}</b><div><span class="top-exp-bar" role="progressbar" aria-label="经验" aria-valuenow="${Math.round(percent)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${percent}%"></i></span><small>EXP ${progress.currentExp} / ${needed}</small></div></div>`;
}

export function globalTopBar(){
 return `<header class="system-top"><div class="top-clock"><span id="os-date"></span><b id="os-clock"></b></div>${globalWeather()}${globalExp()}<div class="top-actions"><button data-action="open-research-library" aria-label="打开研究资料库" title="LOCAL LIBRARY">${icon('training',21)}</button><button data-action="effects" aria-pressed="${state.effects}">FX ${state.effects?'ON':'OFF'}</button><button data-action="settings" aria-label="设置" title="SETTINGS">▦</button></div></header>`;
}

export function globalShell(route,body){return `${globalSidebar(route)}${globalTopBar()}${body}<div class="crt" aria-hidden="true"></div>`}
