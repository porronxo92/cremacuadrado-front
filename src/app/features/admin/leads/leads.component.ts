import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { AdminApiService } from '../shared/admin-api.service';
import { POS_LEAD_STATUS, statusInfo } from '../shared/admin-labels';
import { adminListState } from '../shared/admin-list-state';
import { ADMIN_UI } from '../shared/admin-ui.components';

type LeadTab = 'newsletter' | 'pos' | 'contact';

interface NewsletterLead { id: number; email: string; source: string; coupon_code: string | null; converted_at: string | null; created_at: string }
interface PosLead {
  id: number; name: string; establishment_name: string; city: string; establishment_type: string;
  email: string; phone: string; stage: string; status: string; notes: string | null; created_at: string;
}
interface ContactLead { id: number; name: string; email: string; message: string; accepts_marketing: boolean; source: string; created_at: string }

@Component({
  selector: 'app-admin-leads',
  standalone: true,
  imports: [CommonModule, FormsModule, ...ADMIN_UI],
  template: `
    <div class="adm-page">
      <header class="adm-page-header">
        <div>
          <h1>Leads</h1>
          <p>Contactos captados por la newsletter, la landing B2B y el formulario de contacto</p>
        </div>
        <div class="adm-page-actions">
          <button type="button" class="adm-btn adm-btn--ghost" (click)="exportCsv()">Exportar CSV</button>
        </div>
      </header>

      <nav class="adm-tabs" role="tablist">
        <button type="button" role="tab" [class.is-active]="f.tab === 'newsletter'" (click)="switchTab('newsletter')">Newsletter</button>
        <button type="button" role="tab" [class.is-active]="f.tab === 'pos'" (click)="switchTab('pos')">Tiendas (B2B)</button>
        <button type="button" role="tab" [class.is-active]="f.tab === 'contact'" (click)="switchTab('contact')">Contacto</button>
      </nav>

      <div class="adm-filters">
        <label class="adm-field adm-field--search">
          <span>Buscar</span>
          <input type="search" [(ngModel)]="f.search" (input)="state.typed()" placeholder="Email, nombre…">
        </label>
        @if (f.tab === 'newsletter') {
          <label class="adm-field">
            <span>¿Se registró?</span>
            <select [(ngModel)]="f.converted" (change)="state.apply()">
              <option value="">Todos</option>
              <option value="true">Sí, ya es cliente</option>
              <option value="false">No, aún no</option>
            </select>
          </label>
        }
        @if (f.tab === 'pos') {
          <label class="adm-field">
            <span>Estado</span>
            <select [(ngModel)]="f.status" (change)="state.apply()">
              <option value="">Todos</option>
              @for (s of posStatuses; track s) { <option [value]="s">{{ posLabel(s).label }}</option> }
            </select>
          </label>
        }
      </div>

      @if (loading()) {
        <div class="adm-loading">Cargando…</div>
      } @else {
        <div class="adm-table-wrap is-responsive">
          @switch (f.tab) {
            @case ('newsletter') {
              <table class="adm-table is-responsive">
                <thead><tr><th>Email</th><th>Origen</th><th>Cupón</th><th>¿Cliente?</th><th>Fecha</th></tr></thead>
                <tbody>
                  @for (l of newsletter(); track l.id) {
                    <tr>
                      <td class="is-primary" data-label="Email">{{ l.email }}</td>
                      <td data-label="Origen">{{ l.source }}</td>
                      <td data-label="Cupón">{{ l.coupon_code || '—' }}</td>
                      <td data-label="¿Cliente?">
                        @if (l.converted_at) { <adm-badge tone="success">Sí · {{ l.converted_at | date:'dd/MM/yy' }}</adm-badge> }
                        @else { <adm-badge tone="warning">No</adm-badge> }
                      </td>
                      <td data-label="Fecha">{{ l.created_at | date:'dd/MM/yy HH:mm' }}</td>
                    </tr>
                  } @empty { <tr><td colspan="5" class="adm-empty">Sin leads</td></tr> }
                </tbody>
              </table>
            }
            @case ('pos') {
              <table class="adm-table is-responsive">
                <thead><tr><th>Establecimiento</th><th>Contacto</th><th>Ciudad</th><th>Estado</th><th>Fecha</th><th class="actions"></th></tr></thead>
                <tbody>
                  @for (l of pos(); track l.id) {
                    <tr>
                      <td class="is-primary" data-label="Establecimiento">
                        <div><strong>{{ l.establishment_name }}</strong><span class="sub">{{ l.establishment_type }}</span></div>
                      </td>
                      <td data-label="Contacto">
                        <div>{{ l.name }}<span class="sub">{{ l.email }} · {{ l.phone }}</span></div>
                      </td>
                      <td data-label="Ciudad">{{ l.city }}</td>
                      <td data-label="Estado">
                        <select class="adm-input inline-select" [ngModel]="l.status" (ngModelChange)="updatePos(l, { status: $event })"
                                [attr.aria-label]="'Estado de ' + l.establishment_name">
                          @for (s of posStatuses; track s) { <option [value]="s">{{ posLabel(s).label }}</option> }
                        </select>
                      </td>
                      <td data-label="Fecha">{{ l.created_at | date:'dd/MM/yy' }}</td>
                      <td class="actions" data-label="">
                        <button type="button" class="adm-btn adm-btn--sm adm-btn--ghost" (click)="openNotes(l)">
                          {{ l.notes ? 'Notas ✎' : 'Añadir nota' }}
                        </button>
                      </td>
                    </tr>
                  } @empty { <tr><td colspan="6" class="adm-empty">Sin leads B2B</td></tr> }
                </tbody>
              </table>
            }
            @case ('contact') {
              <table class="adm-table is-responsive">
                <thead><tr><th>Contacto</th><th>Mensaje</th><th>Marketing</th><th>Fecha</th></tr></thead>
                <tbody>
                  @for (l of contact(); track l.id) {
                    <tr>
                      <td class="is-primary" data-label="Contacto"><div>{{ l.name }}<span class="sub">{{ l.email }}</span></div></td>
                      <td data-label="Mensaje" class="message">
                        <button type="button" class="adm-link msg-btn" (click)="message.set(l)">{{ l.message | slice:0:120 }}{{ l.message.length > 120 ? '…' : '' }}</button>
                      </td>
                      <td data-label="Marketing"><adm-badge [tone]="l.accepts_marketing ? 'success' : 'neutral'">{{ l.accepts_marketing ? 'Sí' : 'No' }}</adm-badge></td>
                      <td data-label="Fecha">{{ l.created_at | date:'dd/MM/yy HH:mm' }}</td>
                    </tr>
                  } @empty { <tr><td colspan="4" class="adm-empty">Sin mensajes</td></tr> }
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

    @if (notesLead(); as l) {
      <adm-modal [title]="'Notas · ' + l.establishment_name" size="sm" (closed)="notesLead.set(null)">
        <label class="adm-field">
          <span>Notas internas</span>
          <textarea [(ngModel)]="notesDraft" rows="6" placeholder="Llamada el 12/10, quieren muestra de 1 kg…"></textarea>
        </label>
        <div modal-footer>
          <button type="button" class="adm-btn adm-btn--ghost" (click)="notesLead.set(null)">Cancelar</button>
          <button type="button" class="adm-btn adm-btn--primary" (click)="saveNotes(l)">Guardar</button>
        </div>
      </adm-modal>
    }

    @if (message(); as m) {
      <adm-modal [title]="'Mensaje de ' + m.name" (closed)="message.set(null)">
        <p class="adm-muted">{{ m.email }} · {{ m.created_at | date:'dd/MM/yyyy HH:mm' }}</p>
        <p class="full-msg">{{ m.message }}</p>
        <div modal-footer>
          <span class="adm-muted">Responde desde tu correo a {{ m.email }}</span>
        </div>
      </adm-modal>
    }
  `,
  styles: [`
    .inline-select { width: auto; min-height: 34px; padding: 0.25rem 0.5rem; font-size: 0.8rem; }
    .message { max-width: 380px; }
    .msg-btn { text-align: left; font-weight: 400; color: var(--adm-ink); }
    .full-msg { white-space: pre-wrap; line-height: 1.6; margin: 0; }
  `],
})
export class AdminLeadsComponent implements OnInit {
  private api = inject(AdminApiService);
  private toast = inject(ToastService);

  readonly posStatuses = Object.keys(POS_LEAD_STATUS);

  state = adminListState({ tab: 'newsletter', search: '', converted: '', status: '' }, () => this.load());
  f = this.state.filters;

  newsletter = signal<NewsletterLead[]>([]);
  pos = signal<PosLead[]>([]);
  contact = signal<ContactLead[]>([]);
  loading = signal(true);

  notesLead = signal<PosLead | null>(null);
  notesDraft = '';
  message = signal<ContactLead | null>(null);

  ngOnInit(): void {
    this.load();
  }

  posLabel(s: string) { return statusInfo(POS_LEAD_STATUS, s); }

  switchTab(tab: LeadTab): void {
    Object.assign(this.f, { tab, search: '', converted: '', status: '' });
    this.state.apply();
  }

  load(): void {
    this.loading.set(true);
    const { tab, ...query } = this.state.query();
    this.api.page<NewsletterLead | PosLead | ContactLead>(`/leads/${tab}`, query).subscribe({
      next: res => {
        if (tab === 'pos') this.pos.set(res.items as PosLead[]);
        else if (tab === 'contact') this.contact.set(res.items as ContactLead[]);
        else this.newsletter.set(res.items as NewsletterLead[]);
        this.state.setPage(res);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.toast.error(err.message || 'Error al cargar los leads');
      },
    });
  }

  updatePos(lead: PosLead, changes: { status?: string; notes?: string }, after?: () => void): void {
    this.api.patch(`/leads/pos/${lead.id}`, changes).subscribe({
      next: () => {
        this.pos.update(list => list.map(l => (l.id === lead.id ? { ...l, ...changes } : l)));
        this.toast.success('Lead actualizado');
        after?.();
      },
      error: err => this.toast.error(err.message || 'Error al actualizar'),
    });
  }

  openNotes(lead: PosLead): void {
    this.notesDraft = lead.notes || '';
    this.notesLead.set(lead);
  }

  saveNotes(lead: PosLead): void {
    this.updatePos(lead, { notes: this.notesDraft }, () => this.notesLead.set(null));
  }

  exportCsv(): void {
    const tab = this.f.tab;
    this.api.download('/leads/export/csv', { type: tab }, `leads_${tab}_${new Date().toISOString().slice(0, 10)}.csv`).subscribe({
      error: err => this.toast.error(err.message || 'Error al exportar el CSV'),
    });
  }
}
