import '../shared/polyfills';
import { human_timing } from '../shared/util/genericUtil';
import './css/imports.scss';

function doStuff(thing: string) {
  console.log(thing);
}

console.log('hello world!');
doStuff('foobar');

let someDate = new Date();

console.log(human_timing(someDate));