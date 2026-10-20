import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddressSaved } from './address-saved';

describe('AddressSaved', () => {
  let component: AddressSaved;
  let fixture: ComponentFixture<AddressSaved>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddressSaved],
    }).compileComponents();

    fixture = TestBed.createComponent(AddressSaved);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
