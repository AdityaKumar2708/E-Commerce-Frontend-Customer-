import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StorePickup } from './store-pickup';

describe('StorePickup', () => {
  let component: StorePickup;
  let fixture: ComponentFixture<StorePickup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StorePickup],
    }).compileComponents();

    fixture = TestBed.createComponent(StorePickup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
