/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS201: Simplify complex destructure assignments
 * DS203: Remove `|| {}` from converted for-own loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import * as moment from 'moment'
// tslint:disable-next-line:no-duplicate-imports
import { Moment } from 'moment'

import * as _ from 'lodash'

const addSeparators = (nStr: any, thousandsSep, decimalSep) => {
  const x = String(nStr).split('.');
  let x1 = x[0];
  const x2 = x.length > 1 ? decimalSep + x[1] : '';
  const rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, `$1${thousandsSep}$2`);
  }
  return x1 + x2;
};

const numberFormat = (opts_in?: any) => {
  const defaults = {
    digitsAfterDecimal: 2,
    scaler: 1,
    thousandsSep: ',',
    decimalSep: '.',
    prefix: '',
    suffix: '',
  };
  const opts = Object.assign({}, defaults, opts_in);
  return (x) => {
    if (isNaN(x) || !isFinite(x)) {
      return '';
    }
    const result = addSeparators(
      (opts.scaler * x).toFixed(opts.digitsAfterDecimal),
      opts.thousandsSep,
      opts.decimalSep,
    );
    return `${opts.prefix}${result}${opts.suffix}`;
  };
};

const rx = /(\d+)|(\D+)/g;
const rd = /\d/;
const rz = /^0/;
const naturalSort = (as, bs) => {
  // nulls first
  if (bs !== null && as === null) {
    return -1;
  }
  if (as !== null && bs === null) {
    return 1;
  }

  // then raw NaNs
  if (typeof as === 'number' && isNaN(as)) {
    return -1;
  }
  if (typeof bs === 'number' && isNaN(bs)) {
    return 1;
  }

  // numbers and numbery strings group together
  const nas = Number(as);
  const nbs = Number(bs);
  if (nas < nbs) {
    return -1;
  }
  if (nas > nbs) {
    return 1;
  }

  // within that, true numbers before numbery strings
  if (typeof as === 'number' && typeof bs !== 'number') {
    return -1;
  }
  if (typeof bs === 'number' && typeof as !== 'number') {
    return 1;
  }
  if (typeof as === 'number' && typeof bs === 'number') {
    return 0;
  }

  // 'Infinity' is a textual number, so less than 'A'
  if (isNaN(nbs) && !isNaN(nas)) {
    return -1;
  }
  if (isNaN(nas) && !isNaN(nbs)) {
    return 1;
  }

  // Create Dates if possible
  const aMoment = createSortingMoment(as)
  const bMoment = createSortingMoment(bs)

  // Non Dates Take Priority
  if(!aMoment[1] && bMoment[1]) {
    return 1
  }
  if(aMoment[1] && !bMoment[1]) {
    return -1
  }

  // Compare Dates and return sorted moments
  if(aMoment[1] && bMoment[1]) {
    const aMomentInstance = aMoment[0] as Moment
    const bMomentInstance = bMoment[0] as Moment
    return Number(aMomentInstance.format('YYYYMMDD')) - Number(bMomentInstance.format('YYYYMMDD'))
  }

  // finally, "smart" string sorting per http://stackoverflow.com/a/4373421/112871
  const a = String(as);
  const b = String(bs);
  if (a === b) {
    return 0;
  }
  if (!rd.test(a) || !rd.test(b)) {
    return a > b ? 1 : -1;
  }

  // special treatment for strings containing digits
  const aArray = a.match(rx);
  const bArray = b.match(rx);
  while (a.length && b.length) {
    const a1 = aArray!.shift();
    const b1 = bArray!.shift();
    if (a1 !== b1) {
      if (rd.test(a1 as string) && rd.test(b1 as string)) {
        return parseInt((a1 as string).replace(rz, '.0'), undefined) -
          parseInt((b1 as string).replace(rz, '.0'), undefined)
      }
      return (a1 as string) > (b1 as string) ? 1 : -1;
    }
  }
  return a.length - b.length;
};

const createSortingMoment = (str) => {
  const dayMoment = moment(str,'MM/DD/YYYY')
  if(dayMoment.isValid()) {
    return [dayMoment, 'day']
  }
  const weekMoment = moment(str,'MM/DD - MM/DD YYYY')
  if(weekMoment.isValid()) {
    return [weekMoment, 'week']
  }
  const monthMoment = moment(str, 'MMM YYYY')
  if(monthMoment.isValid()) {
    return [monthMoment, 'month']
  }
  const quarterMoment = moment(str, 'Q YYYY')
  if(quarterMoment.isValid()) {
    return [quarterMoment, 'quarter']
  }
  const yearMoment = moment(str, 'YYYY')
  if(yearMoment.isValid()) {
    return [yearMoment, 'year']
  }
  return [null, null]
}

const sortAs = (order) => {
  const mapping = {};

  // sort lowercased keys similarly
  const l_mapping = {};
  for (const i of Object.keys(order)) {
    const x = order[i];
    mapping[x] = i;
    if (typeof x === 'string') {
      l_mapping[x.toLowerCase()] = i;
    }
  }
  return (a, b) => {
    if (a in mapping && b in mapping) {
      return mapping[a] - mapping[b];
    }
    if (a in mapping) {
      return -1;
    }
    if (b in mapping) {
      return 1;
    }
    if (a in l_mapping && b in l_mapping) {
      return l_mapping[a] - l_mapping[b];
    }
    if (a in l_mapping) {
      return -1;
    }
    if (b in l_mapping) {
      return 1;
    }
    return naturalSort(a, b);
  };
};

const getSort = (sorters, attr: any) => {
  if (sorters) {
    if (typeof sorters === 'function') {
      const sort = sorters(attr);
      if (typeof sort === 'function') {
        return sort;
      }
    } else if (attr in sorters) {
      return sorters[attr];
    }
  }
  return naturalSort;
};

// aggregator templates default to US number formatting but this is overrideable
const usFmt = numberFormat();
const usFmtInt = numberFormat({ digitsAfterDecimal: 0 });
const usFmtPct = numberFormat({
  digitsAfterDecimal: 1,
  scaler: 100,
  suffix: '%',
});

const aggregatorTemplates: {
  count: (formatter?: Function) => any
  uniques: (fn: Function, formatter: Function) => any
  sum: (formatter?: Function) => any
  extremes: (mode: string, formatter: Function) => any
  quantile: (q: number, formatter: Function) => any
  runningStat: (mode: string, ddof: number, formatter: Function) => any
  sumOverSum: (formatter: Function) => any
  fractionOf: (wrapped: Function, type: string, formatter: Function) => any
  countUnique?: (f: Function) => (fn: Function, formatter: Function) => any
  listUnique?: (s: string) => (fn: Function, formatter: Function) => any
  max?: (f: Function) => (mode: string, formatter: Function) => any
  min?: (f: Function) => (mode: string, formatter: Function) => any
  first?: (f: Function) => (mode: string, formatter: Function) => any
  last?: (f: Function) => (mode: string, formatter: Function) => any
  median?: (f: Function) => (q: number, formatter: Function) => any
  average?: (f: Function) => (mode: string, ddof: number, formatter: Function) => any
  var?: (ddof: number, f: Function) => (mode: string, ddof: number, formatter: Function) => any
  stdev?: (ddof: number, f: Function) => (mode: string, ddof: number, formatter: Function) => any,
} = {
  count(formatter = usFmtInt) {
    return () =>
      () => {
        return {
          count: 0,
          push() {
            this.count++;
          },
          value() {
            return this.count;
          },
          format: formatter,
        };
      };
  },

  uniques(fn, formatter = usFmtInt) {
    return ([attr]) => {
      return () => {
        const tempUniq: any[] = []
        // This is a comment
        const returnedObject = {
          uniq: tempUniq,
          push(record: any) {
            if (!Array.from(this.uniq).includes(record[attr])) {
              this.uniq.push(record[attr]);
            }
          },
          value() {
            return fn(this.uniq);
          },
          format: formatter,
          numInputs: typeof attr !== 'undefined' ? 0 : 1,
        }
        return returnedObject
      };
    };
  },

  sum(formatter = usFmt) {
    return ([attr]) => {
      return () => {
        return {
          sum: 0,
          push(record) {
            if (!isNaN(parseFloat(record[attr]))) {
              this.sum += parseFloat(record[attr]);
            }
          },
          value() {
            return this.sum;
          },
          format: formatter,
          numInputs: typeof attr !== 'undefined' ? 0 : 1,
        };
      };
    };
  },

  extremes(mode, formatter = usFmt) {
    return ([attr]) => {
      return (data) => {
        return {
          val: null,
          sorter: getSort(
            typeof data !== 'undefined' ? data.sorters : null,
            attr,
          ),
          push(record) {
            let x = record[attr];
            if (['min', 'max'].includes(mode)) {
              x = parseFloat(x);
              if (!isNaN(x)) {
                this.val = Math[mode](x, this.val !== null ? this.val : x);
              }
            }
            if (
              mode === 'first' &&
              this.sorter(x, this.val !== null ? this.val : x) <= 0
            ) {
              this.val = x;
            }
            if (
              mode === 'last' &&
              this.sorter(x, this.val !== null ? this.val : x) >= 0
            ) {
              this.val = x;
            }
          },
          value() {
            return this.val;
          },
          format(x) {
            if (isNaN(x)) {
              return x;
            }
            return formatter(x);
          },
          numInputs: typeof attr !== 'undefined' ? 0 : 1,
        };
      };
    };
  },

  quantile(q, formatter = usFmt) {
    return ([attr]) => {
      return () => {
        return {
          vals: ([] as any[]),
          push(record) {
            const x = parseFloat(record[attr]);
            if (!isNaN(x)) {
              this.vals.push(x);
            }
          },
          value() {
            if (this.vals.length === 0) {
              return null;
            }
            this.vals.sort((a, b) => a - b);
            const i = (this.vals.length - 1) * q;
            return (this.vals[Math.floor(i)] + this.vals[Math.ceil(i)]) / 2.0;
          },
          format: formatter,
          numInputs: typeof attr !== 'undefined' ? 0 : 1,
        };
      };
    };
  },

  runningStat(mode = 'mean', ddof = 1, formatter = usFmt) {
    return ([attr]) => {
      return () => {
        return {
          n: 0.0,
          m: 0.0,
          s: 0.0,
          push(record) {
            const x = parseFloat(record[attr]);
            if (isNaN(x)) {
              return;
            }
            this.n += 1.0;
            if (this.n === 1.0) {
              this.m = x;
            }
            const m_new = this.m + (x - this.m) / this.n;
            this.s = this.s + (x - this.m) * (x - m_new);
            this.m = m_new;
          },
          value() {
            if (mode === 'mean') {
              if (this.n === 0) {
                return 0 / 0;
              }
              return this.m;
            }
            if (this.n <= ddof) {
              return 0;
            }
            switch (mode) {
              case 'var':
                return this.s / (this.n - ddof);
              case 'stdev':
                return Math.sqrt(this.s / (this.n - ddof));
              default:
                throw new Error('unknown mode for runningStat');
            }
          },
          format: formatter,
          numInputs: typeof attr !== 'undefined' ? 0 : 1,
        };
      };
    };
  },

  sumOverSum(formatter = usFmt) {
    return ([num, denom]) => {
      return () => {
        return {
          sumNum: 0,
          sumDenom: 0,
          push(record) {
            if (!isNaN(parseFloat(record[num]))) {
              this.sumNum += parseFloat(record[num]);
            }
            if (!isNaN(parseFloat(record[denom]))) {
              this.sumDenom += parseFloat(record[denom]);
            }
          },
          value() {
            return this.sumNum / this.sumDenom;
          },
          format: formatter,
          numInputs:
            typeof num !== 'undefined' && typeof denom !== 'undefined' ? 0 : 2,
        };
      };
    };
  },

  fractionOf(wrapped, type = 'total', formatter = usFmtPct) {
    return (...x) =>
      (data, rowKey, colKey) => {
        return {
          selector: { total: [[], []], row: [rowKey, []], col: [[], colKey] }[
            type
],
          inner: wrapped(...Array.from(x || []))(data, rowKey, colKey),
          push(record) {
            this.inner.push(record);
          },
          format: formatter,
          value() {
            return (
              this.inner.value() /
              data
                .getAggregator(...Array.from(this.selector || []))
                .inner.value()
            );
          },
          numInputs: wrapped(...Array.from(x || []))().numInputs,
        };
      };
  },
}

aggregatorTemplates.countUnique = f => aggregatorTemplates.uniques(x => x.length, f);
aggregatorTemplates.listUnique = s => aggregatorTemplates.uniques(x => x.join(s), x => x);
aggregatorTemplates.max = f => aggregatorTemplates.extremes('max', f);
aggregatorTemplates.min = f => aggregatorTemplates.extremes('min', f);
aggregatorTemplates.first = f => aggregatorTemplates.extremes('first', f);
aggregatorTemplates.last = f => aggregatorTemplates.extremes('last', f);
aggregatorTemplates.median = f => aggregatorTemplates.quantile(0.5, f);
aggregatorTemplates.average = f => aggregatorTemplates.runningStat('mean', 1, f);
aggregatorTemplates.var = (ddof, f) => aggregatorTemplates.runningStat('var', ddof, f);
aggregatorTemplates.stdev = (ddof, f) => aggregatorTemplates.runningStat('stdev', ddof, f);

// default aggregators & renderers use US naming and number formatting
const aggregators = (tpl => ({
  Count: tpl.count(usFmtInt),
  'Count Unique Values': tpl.countUnique!(usFmtInt),
  'List Unique Values': tpl.listUnique!(', '),
  Sum: tpl.sum(usFmt),
  'Integer Sum': tpl.sum(usFmtInt),
  Average: tpl.average!(usFmt),
  Median: tpl.median!(usFmt),
  'Sample Variance': tpl.var!(1, usFmt),
  'Sample Standard Deviation': tpl.stdev!(1, usFmt),
  Minimum: tpl.min!(usFmt),
  Maximum: tpl.max!(usFmt),
  First: tpl.first!(usFmt),
  Last: tpl.last!(usFmt),
  'Sum over Sum': tpl.sumOverSum(usFmt),
  'Sum as Fraction of Total': tpl.fractionOf(tpl.sum!(), 'total', usFmtPct),
  'Sum as Fraction of Rows': tpl.fractionOf(tpl.sum!(), 'row', usFmtPct),
  'Sum as Fraction of Columns': tpl.fractionOf(tpl.sum(), 'col', usFmtPct),
  'Count as Fraction of Total': tpl.fractionOf(tpl.count(), 'total', usFmtPct),
  'Count as Fraction of Rows': tpl.fractionOf(tpl.count(), 'row', usFmtPct),
  'Count as Fraction of Columns': tpl.fractionOf(tpl.count(), 'col', usFmtPct),
}))(aggregatorTemplates);

const locales = {
  en: {
    aggregators,
    localeStrings: {
      renderError: 'An error occurred rendering the PivotTable results.',
      computeError: 'An error occurred computing the PivotTable results.',
      uiRenderError: 'An error occurred rendering the PivotTable UI.',
      selectAll: 'Select All',
      selectNone: 'Select None',
      tooMany: '(too many to list)',
      filterResults: 'Filter values',
      apply: 'Apply',
      cancel: 'Cancel',
      totals: 'Totals',
      vs: 'vs',
      by: 'by',
    },
  },
};

// dateFormat deriver l10n requires month and day names to be passed in directly
const mthNamesEn = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const zeroPad = number => `0${number}`.substr(-2, 2); // eslint-disable-line no-magic-numbers

const derivers = {
  bin(col, binWidth) {
    return record => record[col] - record[col] % binWidth;
  },
  dateFormat(
    col,
    formatString,
    utcOutput = false,
    mthNames = mthNamesEn,
    dayNames = dayNamesEn,
  ) {
    const utc = utcOutput ? 'UTC' : '';
    return (record) => {
      const date = new Date(Date.parse(record[col]));
      if (isNaN(parseInt(date.toUTCString(), undefined))) {
        return '';
      }
      return formatString.replace(/%(.)/g, (m, p) => {
        switch (p) {
          case 'y':
            return date[`get${utc}FullYear`]();
          case 'm':
            return zeroPad(date[`get${utc}Month`]() + 1);
          case 'n':
            return mthNames[date[`get${utc}Month`]()];
          case 'd':
            return zeroPad(date[`get${utc}Date`]());
          case 'w':
            return dayNames[date[`get${utc}Day`]()];
          case 'x':
            return date[`get${utc}Day`]();
          case 'H':
            return zeroPad(date[`get${utc}Hours`]());
          case 'M':
            return zeroPad(date[`get${utc}Minutes`]());
          case 'S':
            return zeroPad(date[`get${utc}Seconds`]());
          default:
            return `%${p}`;
        }
      });
    };
  },
};

/*
Data Model class
*/
export type inputData = any[] | Object | Function
// tslint:disable-next-line:interface-name
export interface ObjectOfBooleans {[b: string]: boolean}
// tslint:disable-next-line:interface-name
export interface ObjectOfFunctions {[f: string]: Function}
// tslint:disable-next-line:interface-name
export interface ObjectOfNumbers {[n: string]: number}
// tslint:disable-next-line:interface-name
export interface ObjectOfStringArrays {[a: string]: string[]}
export enum OrderEnum {
  'key_a_to_z' = 'key_a_to_z',
  'value_a_to_z' = 'value_a_to_z',
  'value_z_to_a' = 'value_z_to_a',
}

// interface ITableTemplate {
//   name: string
//   rows: string[]                      // Attribute Names for pivot rows, in order
//   cols: string[]                      // Attribute Names for pivot columns, in order
//   vals: string[]                      // Attribute Names used as arguments for Aggregator.
//                                       //  Mostly looks like (string | <string,string> | null)
//                                       //  (Ex:
//                                       //    AggregatorName='Count', vals=[]
//                                       //    AggregatorName='Distinct Count', vals=['CBO#']
//                                       //    AggregatorName='Sum over Sum',
//                                       //      vals=['visit_Date', 'reference_Date']
//                                       //  )
//   aggregatorName: string              // Name of Aggregator
//   valueFilter: ObjectOfStringArrays   // Object where keys are attribute names,
//                                       //  and values are records
//                                       //  to include or exclude from computation and rendering
//   rendererName: string                // Name of Renderer
//                                       //   (Ex: 'Tables', 'Pie Chart', 'Heat Map', etc.)
//   hiddenAttributes: string[]          // Attributes to Omit from UI
//   rowOrder: OrderEnum                 // Enum declaring which way to order the rows of the table
//   colOrder: OrderEnum                 // Enum declaring which way to order the rows of the table
//   serverValueFilter: ObjectOfStringArrays
// }

// valueFilter = {
//   "site_Name": ['Indiana','California']
// }

// serverValueFilter = {

// }

// res.body = {
//   "": {}
// }

export const MomentFilters =
  /(MomentDate)-(.*)|(MomentWeek)-(.*)|(MomentMonth)-(.*)|(MomentYear)-(.*)/g

export interface IPivotDataProps {
  data: inputData
  aggregators: ObjectOfFunctions
  aggregatorName: string
  cols: string[]
  rows: string[]
  vals: string[]
  valueFilter: {[o: string]: ObjectOfBooleans}
  sorters: ((a: string, b: string) => number) | undefined
  derivedAttributes: ObjectOfFunctions
  rowOrder: OrderEnum
  colOrder: OrderEnum
}
export const PivotDataDefaultProps = {
  aggregators,
  data: [],
  cols: [],
  rows: [],
  vals: [],
  aggregatorName: 'Count',
  sorters: undefined,
  valueFilter: {},
  rowOrder: OrderEnum.key_a_to_z,
  colOrder: OrderEnum.key_a_to_z,
  derivedAttributes: {},
}
class PivotData {
  public defaultProps = PivotDataDefaultProps
  private aggregator: any
  private tree: any
  private rowKeys: any
  private colKeys: any
  private rowTotals: any
  private colTotals: any
  private allTotal: any
  private sorted: boolean
  public props: IPivotDataProps
  private parsedData: any
  constructor(inputProps: { data: inputData } & any = {}) {
    this.props = Object.assign({}, this.defaultProps, inputProps)
    this.aggregator = this.props.aggregators![this.props.aggregatorName!](
      this.props.vals,
    );
    this.tree = {};
    this.rowKeys = [];
    this.colKeys = [];
    this.rowTotals = {};
    this.colTotals = {};
    this.allTotal = this.aggregator(this, [], []);
    this.sorted = false;

    console.log(this.parsedData, this.props.data)

    if(!this.parsedData && this.props.data instanceof Array) {
      this.parsedData = _.cloneDeep(this.props.data)
    }
    console.log(this.parsedData, this.props.data)
    if(this.parsedData instanceof Array) {
      // Iterate Through Array Objects
      for(let i = this.parsedData.length; i--;) {
        const record = this.parsedData[i]
        // Iterate Through Object Keys
        for(const k in record) {
          if(k) {
            const momentRecord = moment(record[k])
            if(momentRecord.isValid()) {
              if(this.props.valueFilter[k]) {
                let parsedRecord = momentRecord.format('L')
                if(this.props.valueFilter[k].week) {
                  const monday = moment(momentRecord).startOf('isoWeek').format('MM/DD')
                  const sunday = moment(momentRecord).endOf('isoWeek').format('MM/DD')
                  parsedRecord = `${monday} - ${sunday} ${momentRecord.format('YYYY')}`
                } else if(this.props.valueFilter[k].month) {
                  parsedRecord = momentRecord.format('MMM YYYY')
                } else if(this.props.valueFilter[k].year) {
                  parsedRecord = momentRecord.format('YYYY')
                } else if(this.props.valueFilter[k].quarter) {
                  parsedRecord = `Q${momentRecord.format('Q YYYY')}`
                }
                this.parsedData[i][k] = parsedRecord
              }
            }
          }
        }
      }
    }

    // iterate through input, accumulating data for cells
    this.forEachRecord(
      this.parsedData,
      this.props.derivedAttributes,
      (record) => {
        if (this.filter(record)) {
          this.processRecord(record);
        }
      },
    );
  }

  public filter(record) {
    for (const k in this.props.valueFilter) {
      if (record[k] in this.props.valueFilter[k]) {
        return false;
      }
    }
    return true;
  }

  public forEachMatchingRecord(criteria, callback) {
    return this.forEachRecord(
      this.parsedData!,
      this.props.derivedAttributes,
      (record) => {
        if (!this.filter(record)) {
          return;
        }
        for (const k of Object.keys(criteria)) {
          const v = criteria[k];
          if (v !== (k in record ? record[k] : 'null')) {
            return;
          }
        }
        callback(record);
      },
    );
  }

  public arrSort(attrs) {
    let c;
    const sortersArr = (() => {
      const result: any[] = [];
      for (c of Array.from(attrs)) {
        result.push(getSort(this.props.sorters, c));
      }
      return result;
    })();
    return (a, b) => {
      for (const i of Object.keys(sortersArr || {})) {
        const sorter = sortersArr[i];
        const comparison = sorter(a[i], b[i]);
        if (comparison !== 0) {
          return comparison;
        }
      }
      return 0;
    };
  }

  public sortKeys() {
    if (!this.sorted) {
      this.sorted = true;
      const v = (r, c) => this.getAggregator(r, c).value();
      switch (this.props.rowOrder) {
        case 'value_a_to_z':
          this.rowKeys.sort((a, b) => naturalSort(v(a, []), v(b, [])));
          break;
        case 'value_z_to_a':
          this.rowKeys.sort((a, b) => -naturalSort(v(a, []), v(b, [])));
          break;
        default:
          this.rowKeys.sort(this.arrSort(this.props.rows));
      }
      switch (this.props.colOrder) {
        case 'value_a_to_z':
          this.colKeys.sort((a, b) => naturalSort(v([], a), v([], b)));
          break;
        case 'value_z_to_a':
          this.colKeys.sort((a, b) => -naturalSort(v([], a), v([], b)));
          break;
        default:
          this.colKeys.sort(this.arrSort(this.props.cols));
      }
    }
  }

  public getColKeys() {
    this.sortKeys();
    return this.colKeys;
  }

  public getRowKeys() {
    this.sortKeys();
    return this.rowKeys;
  }

  public processRecord(record) {
    // this code is called in a tight loop
    const colKey: any = [];
    const rowKey: any = [];
    for (const x of Array.from(this.props.cols as ArrayLike<string>)) {
      colKey.push(x in record ? record[x] : 'null');
    }
    for (const x of Array.from(this.props.rows as ArrayLike<string>)) {
      rowKey.push(x in record ? record[x] : 'null');
    }
    const flatRowKey = rowKey.join(String.fromCharCode(0));
    const flatColKey = colKey.join(String.fromCharCode(0));

    this.allTotal.push(record);

    if (rowKey.length !== 0) {
      if (!this.rowTotals[flatRowKey]) {
        this.rowKeys.push(rowKey);
        this.rowTotals[flatRowKey] = this.aggregator(this, rowKey, []);
      }
      this.rowTotals[flatRowKey].push(record);
    }

    if (colKey.length !== 0) {
      if (!this.colTotals[flatColKey]) {
        this.colKeys.push(colKey);
        this.colTotals[flatColKey] = this.aggregator(this, [], colKey);
      }
      this.colTotals[flatColKey].push(record);
    }

    if (colKey.length !== 0 && rowKey.length !== 0) {
      if (!this.tree[flatRowKey]) {
        this.tree[flatRowKey] = {};
      }
      if (!this.tree[flatRowKey][flatColKey]) {
        this.tree[flatRowKey][flatColKey] = this.aggregator(
          this,
          rowKey,
          colKey,
        );
      }
      this.tree[flatRowKey][flatColKey].push(record);
    }
  }

  public getAggregator(rowKey, colKey) {
    let agg;
    const flatRowKey = rowKey.join(String.fromCharCode(0));
    const flatColKey = colKey.join(String.fromCharCode(0));
    if (rowKey.length === 0 && colKey.length === 0) {
      agg = this.allTotal;
    } else if (rowKey.length === 0) {
      agg = this.colTotals[flatColKey];
    } else if (colKey.length === 0) {
      agg = this.rowTotals[flatRowKey];
    } else {
      agg = this.tree[flatRowKey][flatColKey];
    }
    return (
      agg || {
        value() {
          return null;
        },
        format() {
          return '';
        },
      }
    );
  }

  // can handle arrays or jQuery selections of tables
  public forEachRecord(input: inputData, derivedAttributes?: Object, f?: Function) {
    const attrs = derivedAttributes || {}
    let addRecord
    let record;
    if (attrs && Object.getOwnPropertyNames(attrs).length === 0) {
      addRecord = f;
    } else {
      addRecord = (newRecord) => {
        for (const k of Object.keys(attrs)) {
          const derived = attrs[k](newRecord);
          if (derived !== null) {
            newRecord[k] = derived;
          }
        }
        return f!(newRecord);
      }
    }

    // if it's a function, have it call us back
    if (typeof input === 'function') {
      return input(addRecord);
    }  if (Array.isArray(input)) {
      if (Array.isArray(input[0])) {
        // array of arrays
        return (() => {
          const result: any[] = [];
          for (const i of Object.keys(input || {})) {
            const compactRecord = input[i];
            if (parseInt(i, undefined) > 0) {
              record = {};
              for (const j of Object.keys(input[0] || {})) {
                const k = input[0][j];
                record[k] = compactRecord[j];
              }
              result.push(addRecord(record));
            }
          }
          return result;
        })();
      }

      // array of objects
      return (() => {
        const result1: any[] = [];
        for (record of Array.from(input)) {
          result1.push(addRecord(record));
        }
        return result1;
      })();
    }
    throw new Error('unknown input format');
  }
}

export {
  aggregatorTemplates,
  aggregators,
  derivers,
  locales,
  naturalSort,
  numberFormat,
  getSort,
  sortAs,
  PivotData,
};
