import '../loadenv';
import { defaultMap, isEmpty } from '../../shared/util/genericUtil';
import { resolveObjectPath, toArray } from '../../shared/util/arrayUtil';
import { basename } from 'path';
import { isInt } from '../../shared/util/numberUtil';
import chalk from 'chalk';
import { AbstractControl } from '../domain/abstractControl';

export type InspectOpt = {file: string, inspectFieldValues?: string[], printRecordIfFieldNotEmpty?: string[]};

export async function inspectDataFile(ctrl: AbstractControl, opt: InspectOpt): Promise<any[]> {
  if (!opt.inspectFieldValues)
    opt.inspectFieldValues = [];
  if (!opt.printRecordIfFieldNotEmpty)
    opt.printRecordIfFieldNotEmpty = [];

  const tableName = basename(opt.file).split('.json')[0];
  const result: any[] = await ctrl.readDataFile(opt.file);

  let fieldsToValues: {[fieldName: string]: Set<any>} = defaultMap('Set');
  let fieldsWithUniqueValues: Set<string> = new Set();
  let fieldsToType: {[name: string]: { type: string, canBeNil: boolean }} = {};

  for (let record of result) {
    for (let key of opt.printRecordIfFieldNotEmpty) {
      if (!isEmpty(resolveObjectPath(record, key))) {
        console.log(record);
      }
    }
    for (let key of opt.inspectFieldValues) {
      toArray(resolveObjectPath(record, key)).forEach(value => {
        fieldsToValues[key].add(value);
      });
    }
    for (let key of Object.keys(record)) {
      if (fieldsToValues[key].has(record[key])) {
        fieldsWithUniqueValues.delete(key);
      } else {
        fieldsWithUniqueValues.add(key);
      }
      fieldsToValues[key].add(record[key]);
    }
  }

  for (let field of Object.keys(fieldsToValues)) {
    if (field.includes('.') || field.includes('[')) {
      continue;
    }
    let values = fieldsToValues[field];
    if (field === 'Npc') {
      fieldsToType[field] = { type: 'NpcExcelConfigData', canBeNil: true };
    } else if (field === 'Avatar') {
      fieldsToType[field] = { type: 'AvatarExcelConfigData', canBeNil: true };
    } else if (field === 'Monster') {
      fieldsToType[field] = { type: 'MonsterExcelConfigData', canBeNil: true };
    } else {
      fieldsToType[field] = objType(Array.from(values));
    }
  }

  // values -> array of all possible values for a field
  function objType(values: any[], depth: number = 0): { type: string, canBeNil: boolean } {
    if (!values || !values.length) {
      return { type: 'never', canBeNil: false };
    }
    const concat = (a: string[]) => Array.from(new Set<string>(a)).join('|');

    let primitiveTypes = [];
    let arrayTypes = [];
    let combinedObjectKVs: {[field: string]: Set<any>} = defaultMap('Set');
    let canBeNil = false;

    for (let val of values) {
      if (typeof val === 'undefined' || val === null) {
        canBeNil = true;
      } else if (typeof val === 'number' || typeof val === 'boolean' || typeof val === 'string') {
        primitiveTypes.push(typeof val);
      } else if (Array.isArray(val)) {
        let ret = objType(val, depth + 1);
        if (ret.type !== 'never') {
          arrayTypes.push(ret.type);
        }
      } else if (typeof val === 'object') {
        for (let objKey in val) {
          combinedObjectKVs[objKey].add(val[objKey]);
        }
      }
    }

    let allTypes = [];
    if (primitiveTypes.length) {
      allTypes.push(concat(primitiveTypes));
    }
    if (arrayTypes.length) {
      if (arrayTypes.length === 1) {
        allTypes.push(arrayTypes[0] + '[]');
      } else {
        if ((new Set(arrayTypes)).size <= 1) {
          allTypes.push((arrayTypes[0] || 'never') + '[]');
        } else {
          allTypes.push('(' + concat(arrayTypes) + ')[]');
        }
      }
    }
    if (Object.keys(combinedObjectKVs).length) {
      let s = '{';
      for (let key in combinedObjectKVs) {
        let objValues = Array.from(combinedObjectKVs[key]);
        let ret = objType(objValues, depth + 1);
        s += `, ${key}${ret.canBeNil ? '?' : ''}: ${ret.type}`;
      }
      s += ' }';
      s = s.replace(/\{,/g, `{`);
      allTypes.push(s);
    }

    if ((new Set(allTypes)).size <= 1) {
      return { type: allTypes[0] || 'never', canBeNil };
    } else {
      return { type: '(' + concat(allTypes) + ')', canBeNil };
    }
  }

  console.log('-'.repeat(100))
  for (let field of opt.inspectFieldValues) {
    let values = Array.from(fieldsToValues[field]).sort();
    let isOptionalField = values.some(v => typeof v === 'undefined' || v === null);

    values = values.filter(v => typeof v !== 'undefined' && v !== null)
    values = values.map(x => String(JSON.stringify(x)).replace(/"/g, "'"));

    let singleLineThreshold: boolean = values.join(' | ').length < 110;
    if (!singleLineThreshold) {
      let padEndNum = Math.max(... values.map(v => v.length));
      if (padEndNum % 4 !== 0) {
        padEndNum += 4 - (padEndNum % 4);
      }
      values = values.map(v => v.padEnd(padEndNum));
    }

    let valueStr = values.join(singleLineThreshold ? ' | ' : '|\n  ') + ';';
    if (!singleLineThreshold) {
      valueStr = '  ' + valueStr;
    }
    console.log(`${opt.file} - Unique values for field "${field}":${isOptionalField ? ' (optional field)' : ''}\n` + valueStr);
    console.log();
  }
  console.log(chalk.underline.bold(`Interface:`));
  console.log(`export interface ${tableName} {`);
  for (let field of Object.keys(fieldsToType)) {
    console.log(`  ${field}${fieldsToType[field].canBeNil ? '?' : ''}: ${fieldsToType[field].type},`);
  }
  console.log('}')
  console.log();
  console.log(chalk.underline.bold(`Potential schema:`));
  console.log(`  ${tableName}: <SchemaTable> {`);
  console.log(`    name: '${tableName}',`);
  console.log(`    jsonFile: './ExcelBinOutput/${tableName}.json',`);
  console.log(`    columns: [`);
  let foundPrimary = false;
  for (let field of Object.keys(fieldsToType)) {
    let fieldHasUniqueValues = fieldsWithUniqueValues.has(field);
    let fieldHasMultipleValues = fieldsToValues[field].size > 1;
    let fieldHasPotentialIndexName = (field.endsWith('TextMapHash') || field.endsWith('Id') || field.endsWith('Type') || field.endsWith('Quality') || field.endsWith('Level') || field.endsWith('Order'))
      && !(field.includes('Path') || field.includes('Json') || field.includes('Icon'));
    let fieldHasPotentialPrimaryName = fieldHasPotentialIndexName && !(field.includes('Hash') || field.includes('Type') || field.endsWith('Quality') || field.endsWith('Level') || field.endsWith('Order'));

    let schemaType = fieldsToType[field].type;
    if (schemaType.endsWith('[]')) {
      continue;
    }
    if (schemaType === 'number') {
      if (Array.from(fieldsToValues[field]).some(v => isInt(v) && (v | 0) !== v)) {
        schemaType = 'decimal';
      } else {
        schemaType = 'integer';
      }
    }

    if (fieldHasUniqueValues && fieldHasMultipleValues && fieldHasPotentialPrimaryName && !foundPrimary) {
      foundPrimary = true;
      console.log(`      {name: '${field}', type: '${schemaType}', isPrimary: true},`);
    } else if (fieldHasPotentialIndexName && fieldHasMultipleValues) {
      console.log(`      {name: '${field}', type: '${schemaType}', isIndex: true},`);
    }
  }
  console.log(`    ]`);
  console.log(`  },`);
  console.log();
  console.log(chalk.underline.bold(`End.`));

  return result;
}
