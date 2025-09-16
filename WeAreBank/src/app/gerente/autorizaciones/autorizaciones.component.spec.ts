import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutorizacionesComponent } from './autorizaciones.component';

describe('AutorizacionesComponent', () => {
  let component: AutorizacionesComponent;
  let fixture: ComponentFixture<AutorizacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutorizacionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AutorizacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
