import { Optional } from '../../shared/types/utility-types.ts';
import { strSplice } from '../../shared/util/stringUtil.ts';
import type { Change } from 'diff';
import { inRange, intersectRange, IndexedRange } from '../../shared/util/arrayUtil.ts';

export type MwOwnChangeMode = 'added' | 'removed' | 'unchanged';
export type MwOwnSegment = {
  revId: number,
  value: string,
  owner: string,
  mode: MwOwnChangeMode
  insertAt?: number,
} & IndexedRange;

/**
 * Split segment at a specific index.
 */
function splitSegment(segment: MwOwnSegment, at: number, insert?: MwOwnSegment): MwOwnSegment[] {
  if (at < segment.start || at > segment.end) {
    throw 'Cannot split segment at index not in segment range.';
  }

  if (segment.start === at) {
    return insert ? [insert, segment] : [segment];
  }

  if (segment.end === at) {
    return insert ? [segment, insert] : [segment];
  }

  const relAt: number = at - segment.start;

  const left: MwOwnSegment = {
    revId: segment.revId,
    value: segment.value.slice(0, relAt),
    owner: segment.owner,
    start: segment.start,
    end: at,
    mode: segment.mode,
  };

  const right: MwOwnSegment = {
    revId: segment.revId,
    value: segment.value.slice(relAt),
    owner: segment.owner,
    start: at,
    end: segment.end,
    mode: segment.mode,
  };

  return insert ? [left, insert, right] : [left, right];
}

export class MwOwnSegmentHolder {
  private _segments: MwOwnSegment[] = [];

  get segments(): MwOwnSegment[] {
    return JSON.parse(JSON.stringify(this._segments));
  }

  rejoin(): string {
    return this._segments.map(s => s.value).join('');
  }

  setSegments(segments: Optional<MwOwnSegment, 'start' | 'end'>[], recalculate: boolean = false) {
    this._segments = segments as any;
    if (recalculate) {
      this.recalculateIndices();
    }
  }

  private recalculateIndices() {
    let cursor = 0;
    for (let segment of this._segments) {
      segment.start = cursor;
      segment.end = cursor + segment.value.length;
      cursor += segment.value.length;
    }
  }

  private removeRanges(ranges: MwOwnSegment[]) {
    let accDel = 0;

    for (let _range of ranges.filter(c => c.mode === 'removed')) {
      const range: MwOwnSegment = {
        revId: _range.revId,
        start: _range.start,
        end: _range.end,
        mode: _range.mode,
        value: _range.value,
        owner: _range.owner,
      };

      //console.log('start:', range.start, 'end:', range.end, 'len:', range.value.length, 'accDel:', accDel);

      range.start -= accDel;
      range.end -= accDel;

      for (let segment of this._segments) {
        const intersect = intersectRange(segment, range);
        if (!intersect)
          continue;
        const relStart = intersect.start - segment.start;
        const relEnd = intersect.end - segment.start;

        segment.value = strSplice(segment.value, relStart, relEnd);
      }

      accDel += range.value.length;
      this.recalculateIndices();
    }
  }

  private insertRanges(ranges: MwOwnSegment[]) {
    for (let range of ranges.filter(c => c.mode === 'added')) {
      for (let i = 0; i < this._segments.length; i++) {
        const segment = this._segments[i];

        if (inRange(range.insertAt, segment)) {
          const split = splitSegment(segment, range.insertAt, range);
          this._segments.splice(i, 1, ...split);
          break;
        }
      }
      this.recalculateIndices();
    }
  }

  private clean() {
    let newSegments: MwOwnSegment[] = [];

    let prevOwner: string = null;
    let prevSegment: MwOwnSegment = null;

    for (let segment of this._segments) {
      if (!segment.value)
        continue;

      if (prevSegment && segment.owner === prevOwner) {
        prevSegment.value += segment.value;
        continue;
      }

      newSegments.push(segment);
      prevOwner = segment.owner;
      prevSegment = segment;
    }

    this._segments = newSegments;
    this.recalculateIndices();
  }

  /**
   * Revisions must be applied in order from the oldest revision to newest.
   *
   * @param revId
   * @param revOwner
   * @param _changes
   */
  apply(revId: number, revOwner: string, _changes: Change[]) {
    if (!this._segments.length) {
      this._segments.push(...
        this.asIndexed(revId, revOwner, _changes, 'addedOrUnchanged')
          .filter(c => c.mode === 'added' || c.mode === 'unchanged'),
      );
      return;
    }

    let revChanges: MwOwnSegment[] = this.asIndexed(revId, revOwner, _changes);

    this.removeRanges(revChanges);
    this.insertRanges(revChanges);
    this.clean();
  }

  private asIndexed(revId: number, revOwner: string, _changes: Change[], setOwnerMode: 'addedOnly' | 'addedOrUnchanged' = 'addedOnly'): MwOwnSegment[] {
    let revChanges: MwOwnSegment[] = [];
    let textCursor: number = 0; // only increment on unchanged or removed
    let addCursor: number = 0; // only increment on unchanged or added

    for (let _change of _changes) {
      const value = _change.value;
      const change: MwOwnSegment = Object.assign({
        revId: null,
        owner: null,
        start: -1,
        end: -1,
        mode: (_change.removed ? 'removed' : (_change.added ? 'added' : 'unchanged')) as MwOwnChangeMode,
      }, _change);
      delete change['count'];
      delete change['added'];
      delete change['removed'];

      if (change.mode === 'added') {
        if (!change.owner) {
          change.owner = revOwner;
          change.revId = revId;
        }
        // The computed insertAt position accounts for the previous 'added' changes already being inserted.
        // Because of this, the changes must be inserted in order from first to last. If they are inserted out of
        // order, then it'll be incorrect.
        change.insertAt = addCursor;
        change.start = addCursor;
        change.end = addCursor + value.length;
        addCursor += value.length;
      } else {
        // Unchanged and Removed:
        change.start = textCursor;
        change.end = textCursor + value.length;
        textCursor += value.length;

        if (change.mode === 'unchanged') {
          if (setOwnerMode === 'addedOrUnchanged' && !change.owner) {
            change.owner = revOwner;
            change.revId = revId;
          }
          addCursor += value.length;
        }
      }

      revChanges.push(change);
    }

    return revChanges;
  }
}
