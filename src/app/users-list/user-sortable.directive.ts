// user-sortable.directive.ts
import { Directive, EventEmitter, Input, Output } from '@angular/core';
import { UserItem } from '../interfaces/user.model';

export type SortColumn = keyof UserItem | '';
export type SortDirection = 'asc' | 'desc' | '';

export interface SortEvent {
  column: SortColumn;
  direction: SortDirection;
}

@Directive({
  selector: 'th[sortable]',
  host: {
    '[class.asc]': 'direction === "asc"',
    '[class.desc]': 'direction === "desc"',
    '(click)': 'rotate()'
  },
  standalone: true
})
export class UserSortableDirective {
  @Input() sortable: SortColumn = '';
  @Input() direction: SortDirection = '';
  @Output() sort = new EventEmitter<SortEvent>();

  rotate() {
    this.direction = this.getNextDirection();
    this.sort.emit({ column: this.sortable, direction: this.direction });
  }

  private getNextDirection(): SortDirection {
    const directions: { [key: string]: SortDirection } = { 
      '': 'asc', 
      'asc': 'desc', 
      'desc': '' 
    };
    return directions[this.direction];
  }
}