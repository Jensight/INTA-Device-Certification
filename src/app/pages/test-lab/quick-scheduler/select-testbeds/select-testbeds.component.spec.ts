import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectTestbedsComponent } from './select-testbeds.component';



describe('SelectTestbedComponent', () => {
  let component: SelectTestbedsComponent;
  let fixture: ComponentFixture<SelectTestbedsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectTestbedsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectTestbedsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
