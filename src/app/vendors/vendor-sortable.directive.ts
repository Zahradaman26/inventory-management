import { Directive, EventEmitter, Input, Output } from '@angular/core';

export type SortColumn = keyof any | '';
export type SortDirection = 'asc' | 'desc' | '';

export interface SortEvent {
  column: string;
  direction: SortDirection;
}

@Directive({
  selector: 'th[sortable]',
  standalone: true,
  host: {
    '[class.asc]': 'direction === "asc"',
    '[class.desc]': 'direction === "desc"',
    '(click)': 'rotate()',
  },
})
export class VendorSortableHeader {
  @Input() sortable: string = '';
  @Input() direction: SortDirection = '';
  @Output() sort = new EventEmitter<SortEvent>();

  rotate() {
    this.direction = { '': 'asc', asc: 'desc', desc: '' }[this.direction] as SortDirection;
    this.sort.emit({ column: this.sortable, direction: this.direction });
  }
}