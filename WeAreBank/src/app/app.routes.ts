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

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'cliente', component: ClienteComponent },
  { path: 'consultas', component: ConsultasComponent },
  { path: 'retiros', component: RetirosComponent },
  { path: 'transferencias', component: TransferenciasComponent },
  { path: 'pagos', component: PagosComponent },
  { path: 'prestamos', component: PrestamosComponent },
  { path: 'creditos', component: CreditosComponent },
  { path: '**', redirectTo: '/login' }
];