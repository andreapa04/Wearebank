import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionPermisosComponent } from './gestion-permisos.component';

describe('GestionPermisosComponent', () => {
  let component: GestionPermisosComponent;
  let fixture: ComponentFixture<GestionPermisosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionPermisosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionPermisosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
