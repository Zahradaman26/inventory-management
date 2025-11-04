import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VeiwDetailsComponent } from './veiw-details.component';

describe('VeiwDetailsComponent', () => {
  let component: VeiwDetailsComponent;
  let fixture: ComponentFixture<VeiwDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VeiwDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VeiwDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
