import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReturnExchange } from './return-exchange';

describe('ReturnExchange', () => {
  let component: ReturnExchange;
  let fixture: ComponentFixture<ReturnExchange>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReturnExchange],
    }).compileComponents();

    fixture = TestBed.createComponent(ReturnExchange);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
