import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { AdminApiService } from '../shared/admin-api.service';
import { adminListState } from '../shared/admin-list-state';
import { ADMIN_UI } from '../shared/admin-ui.components';
import { BadgeTone } from '../shared/admin-labels';

type Tab = 'withdrawals' | 'audit' | 'consents';

interface Withdrawal {
  id: number; reference: string; order_id: number; order_number: string | null; order_status: string | null;
  email: string; full_name: string; items_text: string | null; reason: string | null; within_term: boolean;
  status: 'received' | 'accepted' | 'refunded' | 'rejected'; admin_notes: string | null;
  ack_sent_at: string | null; requested_at: string;
}
interface AuditRow { id: number; admin_email: string | null; action: string; path: string; query: string | null; status_code: number | null; ip: string | null; created_at: string; }
interface ConsentRow { id: number; email: string; purpose: string; granted: boolean; policy_version: string; source: string; ip: string | null; created_at: string; }

const W_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  received: { label: 'Recibida', tone: 'warning' },
  accepted: { label: 'Aceptada', tone: 'info' },
  refunded: { label: 'Reembolsada', tone: 'success' },
  rejected: { label: 'Rechazada', tone: 'danger' },
};

/**
 * Cumplimiento: desistimientos (plazo legal de reembolso: 14 días), registro de
 * accesos del personal a datos personales (detección de brechas, 72 h para
 * notificar a la AEPD) y prueba de consentimientos.
 */
@Component({
  selector: 'app-admin-compliance',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ...ADMIN_UI],
  template: `
    <div class="adm-page">
      <header class="adm-page-header">
        <div>
          <h1>Cumplimiento</h1>
          <p>Desistimientos, registro de accesos y consentimientos</p>
        </div>
      </header>

      <nav class="adm-tabs" role="tablist">
        <button type="button" role="tab" [class.is-active]="f.tab === 'withdrawals'" (click)="switchTab('withdrawals')">Desistimientos</button>
        <button type="button" role="tab" [class.is-active]="f.tab === 'audit'" (click)="switchTab('audit')">Registro de accesos</button>
        <button type="button" role="tab" [class.is-active]="f.tab === 'consents'" (click)="switchTab('consents')">Consentimientos</button>
      </nav>

      <div class="adm-filters">
        @switch (f.tab) {
          @case ('withdrawals') {
            <label class="adm-field"><span>Estado</span>
              <select [(ngModel)]="f.status" (change)="state.apply()">
                <option value="">Todos</option>
                <option value="received">Recibidas</option>
                <option value="accepted">Aceptadas</option>
                <option value="refunded">Reembolsadas</option>
                <option value="rejected">Rechazadas</option>
              </select>
            </label>
          }
          @case ('audit') {
            <label class="adm-field adm-field--search"><span>Usuario</span>
              <input type="search" [(ngModel)]="f.admin_email" (input)="state.typed()" placeholder="Email del administrador">
            </label>
            <label class="adm-field adm-field--search"><span>Ruta</span>
              <input type="search" [(ngModel)]="f.path" (input)="state.typed()" placeholder="/api/v1/admin/users…">
            </label>
          }
          @case ('consents') {
            <label class="adm-field adm-field--search"><span>Email</span>
              <input type="search" [(ngModel)]="f.email" (input)="state.typed()" placeholder="Email del interesado">
            </label>
            <label class="adm-field"><span>Finalidad</span>
              <select [(ngModel)]="f.purpose" (change)="state.apply()">
                <option value="">Todas</option>
                <option value="newsletter">Newsletter</option>
                <option value="marketing">Marketing (clientes)</option>
                <option value="terms_register">Registro</option>
                <option value="privacy_contact">Contacto</option>
                <option value="privacy_b2b">B2B</option>
              </select>
            </label>
          }
        }
      </div>

      @if (loading()) {
        <div class="adm-loading">Cargando…</div>
      } @else {
        <div class="adm-table-wrap is-responsive">
          @switch (f.tab) {
            @case ('withdrawals') {
              <table class="adm-table is-responsive">
                <thead><tr><th>Solicitud</th><th>Cliente</th><th>Productos / motivo</th><th>Plazo</th><th>Estado</th><th>Fecha</th><th class="actions"></th></tr></thead>
                <tbody>
                  @for (w of withdrawals(); track w.id) {
                    <tr>
                      <td class="is-primary" data-label="Solicitud">
                        <div><strong class="mono">{{ w.reference }}</strong>
                          <a class="adm-link mono sub" routerLink="/admin/orders" [queryParams]="{ search: w.order_number }">{{ w.order_number }}</a></div>
                      </td>
                      <td data-label="Cliente"><div>{{ w.full_name }}<span class="sub">{{ w.email }}</span></div></td>
                      <td data-label="Productos / motivo"><div>{{ w.items_text || 'Pedido completo' }}<span class="sub">{{ w.reason || '—' }}</span></div></td>
                      <td data-label="Plazo"><adm-badge [tone]="w.within_term ? 'success' : 'danger'">{{ w.within_term ? 'En plazo' : 'Fuera de plazo' }}</adm-badge></td>
                      <td data-label="Estado"><adm-badge [tone]="ws(w.status).tone">{{ ws(w.status).label }}</adm-badge></td>
                      <td data-label="Fecha">
                        {{ w.requested_at + 'Z' | date:'dd/MM/yy HH:mm' }}
                        <span class="sub">Reembolso antes del {{ refundDeadline(w) | date:'dd/MM/yy' }}</span>
                      </td>
                      <td class="actions" data-label="">
                        <button type="button" class="adm-btn adm-btn--sm adm-btn--ghost" (click)="edit.set(w); editStatus = w.status; editNotes = w.admin_notes || ''">Gestionar</button>
                      </td>
                    </tr>
                  } @empty { <tr><td colspan="7" class="adm-empty">Sin solicitudes</td></tr> }
                </tbody>
              </table>
            }
            @case ('audit') {
              <table class="adm-table is-responsive">
                <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Ruta</th><th>Resultado</th><th>IP</th></tr></thead>
                <tbody>
                  @for (a of audit(); track a.id) {
                    <tr>
                      <td data-label="Fecha">{{ a.created_at + 'Z' | date:'dd/MM/yy HH:mm:ss' }}</td>
                      <td data-label="Usuario">{{ a.admin_email || '—' }}</td>
                      <td data-label="Acción"><adm-badge [tone]="a.action === 'LOGIN_FAIL' ? 'danger' : (a.action === 'GET' ? 'neutral' : 'info')">{{ a.action }}</adm-badge></td>
                      <td data-label="Ruta" class="mono path">{{ a.path }}{{ a.query ? '?' + a.query : '' }}</td>
                      <td data-label="Resultado">{{ a.status_code ?? '—' }}</td>
                      <td data-label="IP" class="mono">{{ a.ip || '—' }}</td>
                    </tr>
                  } @empty { <tr><td colspan="6" class="adm-empty">Sin registros</td></tr> }
                </tbody>
              </table>
            }
            @case ('consents') {
              <table class="adm-table is-responsive">
                <thead><tr><th>Fecha</th><th>Email</th><th>Finalidad</th><th>Decisión</th><th>Origen</th><th>Versión</th><th>IP</th></tr></thead>
                <tbody>
                  @for (c of consents(); track c.id) {
                    <tr>
                      <td data-label="Fecha">{{ c.created_at + 'Z' | date:'dd/MM/yy HH:mm' }}</td>
                      <td data-label="Email">{{ c.email }}</td>
                      <td data-label="Finalidad">{{ c.purpose }}</td>
                      <td data-label="Decisión"><adm-badge [tone]="c.granted ? 'success' : 'danger'">{{ c.granted ? 'Otorga' : 'Retira' }}</adm-badge></td>
                      <td data-label="Origen">{{ c.source }}</td>
                      <td data-label="Versión" class="mono">{{ c.policy_version }}</td>
                      <td data-label="IP" class="mono">{{ c.ip || '—' }}</td>
                    </tr>
                  } @empty { <tr><td colspan="7" class="adm-empty">Sin registros</td></tr> }
                </tbody>
              </table>
            }
          }
        </div>
        <adm-pagination [page]="state.page()" [pageSize]="state.pageSize()" [total]="state.total()"
                        [totalPages]="state.totalPages()" (pageChange)="state.goTo($event)"
                        (pageSizeChange)="state.setPageSize($event)" />
      }
    </div>

    @if (edit(); as w) {
      <adm-modal [title]="'Desistimiento ' + w.reference" (closed)="edit.set(null)">
        <p class="adm-muted">Pedido {{ w.order_number }} · {{ w.full_name }} ({{ w.email }})</p>
        <p class="adm-muted">El reembolso debe hacerse desde Stripe (Pagos) como máximo 14 días después de la solicitud.
          Al reembolsar, se emite automáticamente la factura rectificativa.</p>
        <label class="adm-field"><span>Estado</span>
          <select [(ngModel)]="editStatus">
            <option value="received">Recibida</option>
            <option value="accepted">Aceptada (esperando devolución)</option>
            <option value="refunded">Reembolsada</option>
            <option value="rejected">Rechazada</option>
          </select>
        </label>
        <label class="adm-field"><span>Notas internas</span>
          <textarea [(ngModel)]="editNotes" rows="4"></textarea>
        </label>
        <div modal-footer>
          <button type="button" class="adm-btn adm-btn--ghost" (click)="edit.set(null)">Cancelar</button>
          <button type="button" class="adm-btn adm-btn--primary" [disabled]="saving()" (click)="save(w)">Guardar</button>
        </div>
      </adm-modal>
    }
  `,
  styles: [`
    .path { max-width: 380px; overflow-wrap: anywhere; font-size: 0.78rem; }
  `],
})
export class AdminComplianceComponent implements OnInit {
  private api = inject(AdminApiService);
  private toast = inject(ToastService);

  state = adminListState(
    { tab: 'withdrawals', status: '', admin_email: '', path: '', email: '', purpose: '' },
    () => this.load(),
  );
  f = this.state.filters;

  withdrawals = signal<Withdrawal[]>([]);
  audit = signal<AuditRow[]>([]);
  consents = signal<ConsentRow[]>([]);
  loading = signal(true);
  saving = signal(false);
  edit = signal<Withdrawal | null>(null);
  editStatus = 'received';
  editNotes = '';

  ngOnInit(): void {
    this.load();
  }

  ws(s: string) { return W_STATUS[s] ?? { label: s, tone: 'neutral' as BadgeTone }; }

  refundDeadline(w: Withdrawal): Date {
    return new Date(new Date(w.requested_at + 'Z').getTime() + 14 * 24 * 3600 * 1000);
  }

  switchTab(tab: Tab): void {
    Object.assign(this.f, { tab, status: '', admin_email: '', path: '', email: '', purpose: '' });
    this.state.apply();
  }

  load(): void {
    this.loading.set(true);
    const { tab, ...query } = this.state.query();
    const path = tab === 'audit' ? '/audit-log' : tab === 'consents' ? '/consents' : '/withdrawals';
    this.api.page<any>(path, query).subscribe({
      next: res => {
        if (tab === 'audit') this.audit.set(res.items);
        else if (tab === 'consents') this.consents.set(res.items);
        else this.withdrawals.set(res.items);
        this.state.setPage(res);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.toast.error(err.message || 'Error al cargar');
      },
    });
  }

  save(w: Withdrawal): void {
    this.saving.set(true);
    this.api.patch<Withdrawal>(`/withdrawals/${w.id}`, { status: this.editStatus, admin_notes: this.editNotes }).subscribe({
      next: updated => {
        this.saving.set(false);
        this.withdrawals.update(list => list.map(x => (x.id === updated.id ? updated : x)));
        this.edit.set(null);
        this.toast.success('Solicitud actualizada');
      },
      error: err => {
        this.saving.set(false);
        this.toast.error(err.message || 'No se pudo guardar');
      },
    });
  }
}
