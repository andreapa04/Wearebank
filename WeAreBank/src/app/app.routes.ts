import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ClienteComponent } from './cliente/cliente/cliente.component';
import { ConsultasComponent } from './cliente/consultas/consultas.component';
import { RetirosComponent } from './cliente/retiros/retiros.component';
import { TransferenciasComponent } from './cliente/transferencias/transferencias.component';
import { PagosComponent } from './cliente/pagos/pagos.component';
import { PrestamosComponent } from './cliente/prestamos/prestamos.component';
import { CreditosComponent } from './cliente/creditos/creditos.component';
import { GerenteHomeComponent } from './gerente/gerente-home/gerente-home.component';
import { AutorizacionesComponent } from './gerente/autorizaciones/autorizaciones.component';
import { CuentasComponent } from './gerente/cuentas/cuentas.component';
import { GestionPermisosComponent } from './gerente/gestion-permisos/gestion-permisos.component';
import { SolicitudesComponent } from './gerente/solicitudes/solicitudes.component';
import { EjecutivosComponent } from './ejecutivos/ejecutivos.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Rutas públicas
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Rutas de cliente (rol = 2)
  { path: 'cliente', component: ClienteComponent, canActivate: [AuthGuard] },
  { path: 'cliente/consultas', component: ConsultasComponent, canActivate: [AuthGuard] },
  { path: 'cliente/retiros', component: RetirosComponent, canActivate: [AuthGuard] },
  { path: 'cliente/transferencias', component: TransferenciasComponent, canActivate: [AuthGuard] },
  { path: 'cliente/pagos', component: PagosComponent, canActivate: [AuthGuard] },
  { path: 'cliente/prestamos', component: PrestamosComponent, canActivate: [AuthGuard] },
  { path: 'cliente/creditos', component: CreditosComponent, canActivate: [AuthGuard] },

  // Rutas de gerente (rol = 0)
  { path: 'gerente', component: GerenteHomeComponent, canActivate: [AuthGuard] },
  { path: 'gerente/autorizaciones', component: AutorizacionesComponent, canActivate: [AuthGuard] },
  { path: 'gerente/cuentas', component: CuentasComponent, canActivate: [AuthGuard] },
  { path: 'gerente/gestion-permisos', component: GestionPermisosComponent, canActivate: [AuthGuard] },
  { path: 'gerente/solicitudes', component: SolicitudesComponent, canActivate: [AuthGuard] },

  // Rutas de ejecutivo (rol = 1)
  { path: 'ejecutivo', component: EjecutivosComponent, canActivate: [AuthGuard] },

  // Ruta por defecto
  { path: '**', redirectTo: '/login' }
];
