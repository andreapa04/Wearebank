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
import { EjecutivoLayoutComponent } from './ejecutivos/layout/ejecutivo-layout.component';
import { EjecutivosComponent } from './ejecutivos/ejecutivos/ejecutivos.component';


// ✅ Importación corregida de los dos navbars
import { NavbarComponent } from './cliente/components/navbar/navbar.component';
import { NavbarComponent as NavbarComponentGer } from './gerente/navbar/navbar.component';


import { PdfComponent } from './pdf/pdf.component'; //PDF Prubeas

export const routes: Routes = [
  // Rutas públicas
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Rutas de cliente
  { path: 'cliente', component: ClienteComponent },
  { path: 'cliente/consultas', component: ConsultasComponent },
  { path: 'cliente/retiros', component: RetirosComponent },
  { path: 'cliente/transferencias', component: TransferenciasComponent },
  { path: 'cliente/pagos', component: PagosComponent },
  { path: 'cliente/prestamos', component: PrestamosComponent },
  { path: 'cliente/creditos', component: CreditosComponent },
  { path: 'cliente/navbar', component: NavbarComponent }, // 👈 Navbar cliente

  // Rutas de gerente
  { path: 'gerente', component: GerenteHomeComponent },
  { path: 'gerente/autorizaciones', component: AutorizacionesComponent },
  { path: 'gerente/cuentas', component: CuentasComponent },
  { path: 'gerente/gestion-permisos', component: GestionPermisosComponent },
  { path: 'gerente/solicitudes', component: SolicitudesComponent },
  { path: 'gerente/navbar', component: NavbarComponentGer }, // 👈 Navbar gerente


  // Rutas de ejecutivos
  { path: 'ejecutivos', component: EjecutivoLayoutComponent, 
    children: [
      { path: '', component: EjecutivosComponent },
      { path: 'cuentas', loadComponent: () => import('./ejecutivos/cuentas/cuentas.component').then(m => m.CuentasComponent) },
      {path: 'solicitudes', loadComponent: () => import('./ejecutivos/solicitudes/solicitudes.component').then(m => m.SolicitudesComponent) },
      { path: 'consultas', loadComponent: () => import('./ejecutivos/consultas/consultas.component').then(m => m.ConsultasComponent) }
    ]
  },


    // 👇 Ruta de prueba para el PDF
  { path: 'pdf', component: PdfComponent },
  
  // Ruta por defecto
  { path: '**', redirectTo: '/login' }
];
