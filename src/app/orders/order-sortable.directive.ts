import { Directive, EventEmitter, Input, Output } from '@angular/core';

// Define the types used by the directive and service
export type SortColumn = string;
export type SortDirection = 'asc' | 'desc' | '';
const rotate: { [key: string]: SortDirection } = { 'asc': 'desc', 'desc': '', '': 'asc' };

export interface SortEvent {
  column: SortColumn;
  direction: SortDirection;
}

@Directive({
  selector: 'th[orderSortable]',
  standalone: true,
  host: {
    '[class.asc]': 'direction === "asc"',
    '[class.desc]': 'direction === "desc"',
    
    '(click)': 'rotate()'
  }
})
export class OrderSortableHeader {

  @Input() orderSortable: SortColumn = '';
  @Input() direction: SortDirection = '';
  @Output() sort = new EventEmitter<SortEvent>();

  rotate() {
    this.direction = rotate[this.direction];
    this.sort.emit({ column: this.orderSortable, direction: this.direction });
  }
}