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
  // Selector targets any <th> tag with the attribute 'productSortable'
  selector: 'th[productSortable]',
  standalone: true,
  host: {
    // 🔑 Binds CSS classes for ascending/descending arrows
    '[class.asc]': 'direction === "asc"',
    '[class.desc]': 'direction === "desc"',
    // 🔑 Binds the click event to the rotate() function
    '(click)': 'rotate()'
  }
})
export class ProductSortableHeader {

  // The column name (e.g., 'name', 'price', 'SKU') passed from the HTML
  @Input() productSortable: SortColumn = '';
  
  // The current sort direction for this column
  @Input() direction: SortDirection = '';
  
  // Event emitted to the parent component when the header is clicked
  @Output() sort = new EventEmitter<SortEvent>();

  rotate() {
    // Cycles the direction: '' -> 'asc' -> 'desc' -> ''
    this.direction = rotate[this.direction];
    
    // Emit the new sort state to the ProductsComponent
    this.sort.emit({ column: this.productSortable, direction: this.direction });
  }
}