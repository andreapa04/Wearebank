import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ejecutivos } from './ejecutivos';

describe('Ejecutivos', () => {
  let component: Ejecutivos;
  let fixture: ComponentFixture<Ejecutivos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ejecutivos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Ejecutivos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
