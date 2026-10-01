// Future local PNG sprite registry based on the approved reference sheet.
// The files are intentionally not bundled or connected to the UI yet.
// Current business values are translated here; this module owns no cat state.
export const CAT_ASSET_BASE='assets/cat/';

export const CAT_ASSETS=Object.freeze({
 happy:'cat-happy.png',
 calm:'cat-calm.png',
 normal:'cat-normal.png',
 tired:'cat-tired.png',
 sad:'cat-sad.png',
 angry:'cat-angry.png',
 sidebar:'cat-sidebar.png',
 sunny:'cat-sunny.png',
 rainy:'cat-rainy.png',
 cloudy:'cat-cloudy.png',
 night:'cat-night.png',
 snowy:'cat-snowy.png',
 windy:'cat-windy.png',
 // The live app currently emits `cold` for low apparent temperatures even
 // without snow, so it remains distinct from the reference's snowy state.
 cold:'cat-cold.png',
 sleeping:'cat-sleeping.png',
 sitting:'cat-sitting.png',
 tiny:'cat-tiny.png'
});

// Compatibility names from the first registry. They resolve to the new
// reference vocabulary without creating duplicate files or application state.
export const CAT_ASSET_ALIASES=Object.freeze({
 'weather-normal':'cloudy',
 'weather-rain':'rainy',
 'weather-rainy':'rainy',
 'weather-cloudy':'cloudy',
 'weather-night':'night',
 'weather-cold':'cold',
 'weather-sunny':'sunny',
 'weather-snowy':'snowy',
 'weather-windy':'windy'
});

const MOOD_VARIANTS=Object.freeze({
 开心:'happy',
 平静:'calm',
 一般:'normal',
 疲惫:'tired',
 低落:'sad',
 难过:'sad',
 生气:'angry',
 困倦:'sleeping',
 happy:'happy',
 calm:'calm',
 neutral:'normal',
 normal:'normal',
 tired:'tired',
 sad:'sad',
 cry:'sad',
 angry:'angry',
 sleep:'sleeping',
 sleeping:'sleeping'
});

const WEATHER_VARIANTS=Object.freeze({
 // Current catWeather() values: normal, rain, cold and sunny.
 normal:'cloudy',
 rain:'rainy',
 rainy:'rainy',
 cloudy:'cloudy',
 night:'night',
 cold:'cold',
 sunny:'sunny',
 snowy:'snowy',
 windy:'windy'
});

export function moodCatVariant(value='一般'){
 return MOOD_VARIANTS[String(value||'').trim()]||'normal';
}

export function weatherCatVariant(value='normal'){
 const key=typeof value==='boolean'?(value?'rain':'normal'):String(value||'normal').trim();
 return WEATHER_VARIANTS[key]||'cloudy';
}

export function catAsset(variant='normal'){
 const requested=String(variant||'normal').trim();
 const key=Object.hasOwn(CAT_ASSETS,requested)?requested:CAT_ASSET_ALIASES[requested]||'normal';
 return CAT_ASSET_BASE+CAT_ASSETS[key];
}
