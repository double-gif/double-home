import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {CAT_ASSETS,CAT_ASSET_ALIASES,catAsset,moodCatVariant,weatherCatVariant} from '../dist/components/pixel/cat-assets.js';
import {catImg,diaryCat,moodCat,weatherCat} from '../dist/components/pixel/cats.js';
import {icon} from '../dist/components/pixel/primitives.js';

const required=['happy','calm','normal','tired','sad','angry','sidebar','sunny','rainy','cloudy','night','snowy','windy','sleeping','sitting','tiny'];

test('future cat registry exposes local PNG paths for every approved variant',()=>{
 for(const variant of required){
  assert.ok(CAT_ASSETS[variant],variant);
  assert.equal(catAsset(variant),`assets/cat/${CAT_ASSETS[variant]}`);
  assert.match(catAsset(variant),/^assets\/cat\/cat-[a-z-]+\.png$/);
 }
 assert.equal(catAsset('unknown'),'assets/cat/cat-normal.png');
});

test('first-registry weather names remain path-only aliases',()=>{
 assert.equal(CAT_ASSET_ALIASES['weather-rain'],'rainy');
 assert.equal(CAT_ASSET_ALIASES['weather-normal'],'cloudy');
 assert.equal(catAsset('weather-rain'),'assets/cat/cat-rainy.png');
 assert.equal(catAsset('weather-sunny'),'assets/cat/cat-sunny.png');
 assert.equal(catAsset('weather-cold'),'assets/cat/cat-cold.png');
});

test('existing mood and weather values map at the visual layer only',()=>{
 assert.deepEqual(['开心','平静','一般','疲惫','低落','生气'].map(moodCatVariant),['happy','calm','normal','tired','sad','angry']);
 assert.equal(moodCatVariant('难过'),'sad');
 assert.equal(moodCatVariant('困倦'),'sleeping');
 assert.equal(weatherCatVariant('rain'),'rainy');
 assert.equal(weatherCatVariant('cold'),'cold');
 assert.equal(weatherCatVariant('sunny'),'sunny');
 assert.equal(weatherCatVariant('night'),'night');
 assert.equal(weatherCatVariant('snowy'),'snowy');
 assert.equal(weatherCatVariant('windy'),'windy');
 assert.equal(weatherCatVariant(true),'rainy');
 assert.equal(weatherCatVariant(false),'cloudy');
});

test('approved mood, weather, sidebar, tiny and diary PNGs render through the registry',()=>{
 for(const [mood,asset] of [['开心','happy'],['平静','calm'],['一般','normal'],['疲惫','tired'],['低落','sad'],['生气','angry'],['困倦','sleeping']]){
  const html=moodCat(mood,48);
  assert.match(html,new RegExp(`src="assets/cat/cat-${asset}\\.png"`));
  assert.doesNotMatch(html,/<svg/);
 }
 assert.match(catImg('sidebar'),/cat-sidebar\.png/);
 assert.match(catImg('tiny'),/cat-tiny\.png/);
 assert.match(diaryCat('',28),/cat-tiny\.png/);
 assert.match(diaryCat('生气',28),/cat-angry\.png/);
 assert.match(weatherCat('normal'),/cat-cloudy\.png/);
 assert.match(weatherCat('rain'),/cat-rainy\.png/);
 assert.match(weatherCat('sunny'),/cat-sunny\.png/);
 assert.match(icon('happy',30),/cat-happy\.png/);
});

test('cold alone retains the legacy SVG because no cold PNG exists',()=>{
 assert.equal(fs.existsSync('dist/assets/cat/cat-cold.png'),false);
 assert.match(weatherCat('cold'),/<svg[^>]*legacy-cold-cat/);
 assert.doesNotMatch(weatherCat('cold'),/cat-snowy|cat-cold\.png/);
 for(const mode of ['normal','rain','sunny'])assert.doesNotMatch(weatherCat(mode),/<svg/);
});

test('approved PNG bytes match the supplied local assets',()=>{
 const hashes={
  angry:'5af11cf8caeff4f55f684e30a67468ba18a6e64096e1265c096c734a79dc21d2',
  calm:'302474cb86ee223698d1a763ddd3ee381ecff40044245e065ea97549436f4855',
  cloudy:'49d9d8562bc2194292f3423d84187c5668a5321b30fd455c91b06bbf5689210a',
  happy:'f95634e0a886e75c1546277d424ee30f8a6af591b9247390723586ed85e23cb8',
  normal:'c5691ff2e7860b1eed4ae35152a701ed540fc3195883f9e6a1c2f8fb6ea25405',
  rainy:'d5f0db24578e8451589932813d5179026af02e6fc4d8217dcdbc11562a13ec2c',
  sad:'424ea2415c08a11ee6b618cc43cedeecf3253be9bbed2e0a6123fe02c918fb2e',
  sidebar:'2d645eb5e6c948795f2eee2504ba99b47495dec674ec44dd6a765a520ba86b7e',
  sleeping:'facdc41421c94a2432ea922ddd15682a0c7ba59cce693129e7da3d492a17235c',
  sunny:'45a7f6d87205e21ad5ce0c59710792a513ebace43ccbb1bc20e531cc545add20',
  tiny:'d2dd74540fab928990b1aaa7c74c4c813eafcc29e5215224ec63e341b3620638',
  tired:'f1f0e7997acab8d52bc3c5d92762eca08e233ae941d8662d45339641d0b508d4'
 };
 for(const [name,expected] of Object.entries(hashes)){
  const actual=crypto.createHash('sha256').update(fs.readFileSync(`dist/assets/cat/cat-${name}.png`)).digest('hex');
  assert.equal(actual,expected,name);
 }
});

test('registry has no networking, storage or procedural drawing behavior',()=>{
 const source=fs.readFileSync('dist/components/pixel/cat-assets.js','utf8');
 assert.doesNotMatch(source,/fetch\(|XMLHttpRequest|localStorage|indexedDB|<svg|<canvas|innerHTML|data:image/);
 assert.deepEqual(fs.readdirSync('dist/assets/cat').sort(),['.gitkeep','cat-angry.png','cat-calm.png','cat-cloudy.png','cat-happy.png','cat-normal.png','cat-rainy.png','cat-sad.png','cat-sidebar.png','cat-sleeping.png','cat-sunny.png','cat-tiny.png','cat-tired.png']);
});
