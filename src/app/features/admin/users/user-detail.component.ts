import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApiMessage } from '../../../core/models';
import { AdminApiService } from '../shared/admin-api.service';
import { AdminUserDetail, AdminUserUpdate } from '../shared/admin.models';
import { ORDER_STATUS, REVIEW_STATUS, statusInfo } from '../shared/admin-labels';
import { ADMIN_UI, AdminConfirmService } from '../shared/admin-ui.components';

interface TimelineEvent { date: string; icon: string; text: string; link?: (string | number)[]; query?: Record<string, string> }
type Tab = 'activity' | 'orders' | 'coupons' | 'reviews' | 'cart' | 'addresses';

@Component({
  selector: 'app-admin-user-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ...ADMIN_UI],
  template: `
    <div class="adm-page">
      <a class="adm-link back" routerLink="/admin/clientes">← Clientes</a>

      @if (loading()) {
        <div class="adm-loading">Cargando ficha…</div>
      } @else {
      @if (user(); as u) {
        <header class="adm-page-header">
          <div>
            <h1>{{ fullName() || 'Sin nombre' }}</h1>
            <p>{{ u.email }}@if (u.phone) { · {{ u.phone }} }</p>
            <div class="badges">
              <adm-badge [tone]="u.role === 'admin' ? 'brand' : 'neutral'">{{ u.role === 'admin' ? 'Administrador' : 'Cliente' }}</adm-badge>
              <adm-badge [tone]="u.is_active ? 'success' : 'danger'">{{ u.is_active ? 'Activo' : 'Desactivado' }}</adm-badge>
              <adm-badge [tone]="u.email_verified ? 'success' : 'warning'">{{ u.email_verified ? 'Email verificado' : 'Email sin verificar' }}</adm-badge>
              @if (u.google_linked) { <adm-badge tone="info">Google</adm-badge> }
              @if (!u.has_password) { <adm-badge tone="neutral">Sin contraseña</adm-badge> }
              @if (u.marketing_opt_in) { <adm-badge tone="info">Acepta marketing</adm-badge> }
              @if (isLocked()) { <adm-badge tone="danger">Bloqueado hasta {{ u.locked_until | date:'HH:mm' }}</adm-badge> }
              @if (isSelf()) { <adm-badge tone="brand">Eres tú</adm-badge> }
            </div>
          </div>
          <div class="adm-page-actions">
            <button type="button" class="adm-btn adm-btn--primary" (click)="openEdit()">Editar</button>
            <button type="button" class="adm-btn" (click)="showSecurity.set(true)">Seguridad</button>
            <a class="adm-btn adm-btn--ghost" [routerLink]="['/admin/orders']" [queryParams]="{ user_id: u.id }">Ver pedidos</a>
          </div>
        </header>

        <div class="adm-grid--stats">
          <adm-stat label="Pedidos" [value]="u.stats.total_orders" [hint]="u.stats.paid_orders + ' pagados'" />
          <adm-stat label="Total gastado" [value]="(u.stats.total_spent | currency:'EUR') ?? ''" [highlight]="true" />
          <adm-stat label="Ticket medio" [value]="(u.stats.average_order_value | currency:'EUR') ?? ''" />
          <adm-stat label="Cupones usados" [value]="u.stats.coupons_used" [hint]="(u.stats.total_discount | currency:'EUR') + ' de descuento'" />
          <adm-stat label="Último acceso" [value]="u.last_login_at ? ((u.last_login_at | date:'dd/MM/yy') ?? '') : '—'"
                    [hint]="u.login_count + ' accesos desde el registro'" />
          <adm-stat label="Cliente desde" [value]="(u.created_at | date:'dd/MM/yy') ?? ''"
                    [hint]="u.stats.last_order_at ? 'Último pedido ' + (u.stats.last_order_at | date:'dd/MM/yy') : 'Aún no ha comprado'" />
        </div>

        <nav class="adm-tabs" role="tablist">
          @for (t of tabs; track t.id) {
            <button type="button" role="tab" [class.is-active]="tab() === t.id" [attr.aria-selected]="tab() === t.id" (click)="tab.set(t.id)">
              {{ t.label }} @if (t.count(u) !== null) { <span class="adm-muted">({{ t.count(u) }})</span> }
            </button>
          }
        </nav>

        @switch (tab()) {
          @case ('activity') {
            <section class="adm-card">
              <ol class="timeline">
                @for (ev of timeline(); track $index) {
                  <li>
                    <span class="timeline__icon" aria-hidden="true">{{ ev.icon }}</span>
                    <div>
                      @if (ev.link) {
                        <a class="adm-link" [routerLink]="ev.link" [queryParams]="ev.query">{{ ev.text }}</a>
                      } @else { {{ ev.text }} }
                      <span class="sub">{{ ev.date | date:'dd/MM/yyyy HH:mm' }}</span>
                    </div>
                  </li>
                } @empty {
                  <li class="adm-muted">Sin actividad registrada</li>
                }
              </ol>
            </section>
          }
          @case ('orders') {
            <div class="adm-table-wrap is-responsive">
              <table class="adm-table is-responsive">
                <thead><tr><th>Pedido</th><th>Fecha</th><th>Estado</th><th>Cupón</th><th class="num">Total</th></tr></thead>
                <tbody>
                  @for (o of u.orders; track o.id) {
                    <tr>
                      <td class="is-primary" data-label="Pedido">
                        <a class="adm-link mono" [routerLink]="['/admin/orders']" [queryParams]="{ search: o.order_number }">{{ o.order_number }}</a>
                      </td>
                      <td data-label="Fecha">{{ o.created_at | date:'dd/MM/yy HH:mm' }}</td>
                      <td data-label="Estado"><adm-badge [tone]="orderStatus(o.status).tone">{{ orderStatus(o.status).label }}</adm-badge></td>
                      <td data-label="Cupón">{{ o.coupon_code || '—' }}</td>
                      <td class="num" data-label="Total">{{ o.total | currency:'EUR' }}</td>
                    </tr>
                  } @empty { <tr><td colspan="5" class="adm-empty">Sin pedidos</td></tr> }
                </tbody>
              </table>
            </div>
          }
          @case ('coupons') {
            <div class="adm-table-wrap is-responsive">
              <table class="adm-table is-responsive">
                <thead><tr><th>Cupón</th><th>Pedido</th><th>Fecha</th><th class="num">Descuento</th><th>Estado</th></tr></thead>
                <tbody>
                  @for (r of u.coupon_redemptions; track r.id) {
                    <tr>
                      <td class="is-primary" data-label="Cupón">
                        <a class="adm-link mono" routerLink="/admin/cupones" [queryParams]="{ search: r.coupon_code }">{{ r.coupon_code }}</a>
                      </td>
                      <td data-label="Pedido" class="mono">{{ r.order_number || '#' + r.order_id }}</td>
                      <td data-label="Fecha">{{ r.created_at | date:'dd/MM/yy' }}</td>
                      <td class="num" data-label="Descuento">{{ r.discount_amount | currency:'EUR' }}</td>
                      <td data-label="Estado">
                        <adm-badge [tone]="r.reverted_at ? 'neutral' : 'success'">{{ r.reverted_at ? 'Revertido' : 'Aplicado' }}</adm-badge>
                      </td>
                    </tr>
                  } @empty { <tr><td colspan="5" class="adm-empty">No ha usado cupones</td></tr> }
                </tbody>
              </table>
            </div>
          }
          @case ('reviews') {
            <section class="adm-card list">
              @for (r of u.reviews; track r.id) {
                <article>
                  <header>
                    <strong>{{ r.product_name }}</strong>
                    <span class="stars" [attr.aria-label]="r.rating + ' de 5'">{{ '★'.repeat(r.rating) }}{{ '☆'.repeat(5 - r.rating) }}</span>
                    <adm-badge [tone]="reviewStatus(r.status).tone">{{ reviewStatus(r.status).label }}</adm-badge>
                    <span class="adm-muted">{{ r.created_at | date:'dd/MM/yy' }}</span>
                  </header>
                  @if (r.title) { <p><strong>{{ r.title }}</strong></p> }
                  @if (r.comment) { <p>{{ r.comment }}</p> }
                </article>
              } @empty { <p class="adm-muted">Sin reseñas</p> }
            </section>
          }
          @case ('cart') {
            <section class="adm-card">
              @if (u.cart; as c) {
                <p class="adm-muted">Última modificación {{ c.updated_at | date:'dd/MM/yyyy HH:mm' }}
                  @if (c.coupon_code) { · cupón <strong>{{ c.coupon_code }}</strong> }</p>
                <table class="adm-table">
                  <thead><tr><th>Producto</th><th class="num">Uds.</th><th class="num">Total</th></tr></thead>
                  <tbody>
                    @for (it of c.items; track $index) {
                      <tr><td>{{ it.product_name }} @if (it.format) { <span class="sub">{{ it.format }}</span> }</td>
                        <td class="num">{{ it.quantity }}</td><td class="num">{{ it.total | currency:'EUR' }}</td></tr>
                    }
                  </tbody>
                </table>
                <p class="cart-total">Subtotal <strong>{{ c.subtotal | currency:'EUR' }}</strong></p>
              } @else {
                <p class="adm-muted">El carrito está vacío</p>
              }
            </section>
          }
          @case ('addresses') {
            <div class="adm-grid">
              @for (a of u.addresses; track a.id) {
                <section class="adm-card">
                  <h3>{{ a.label || 'Dirección' }} @if (a.is_default) { <adm-badge tone="brand">Principal</adm-badge> }</h3>
                  <p class="addr">{{ a.first_name }} {{ a.last_name }}<br>{{ a.street }}@if (a.street_2) {, {{ a.street_2 }}}<br>
                    {{ a.postal_code }} {{ a.city }} ({{ a.province }})<br>{{ a.phone }}</p>
                </section>
              } @empty { <p class="adm-muted">Sin direcciones guardadas</p> }
            </div>
          }
        }

        <section class="adm-card danger-zone">
          <h3>Zona delicada</h3>
          <div class="danger-zone__row">
            <div>
              <strong>{{ u.is_active ? 'Desactivar cuenta' : 'Reactivar cuenta' }}</strong>
              <p class="adm-muted">{{ u.is_active ? 'No podrá iniciar sesión y se cerrarán sus sesiones.' : 'Podrá volver a iniciar sesión.' }}</p>
            </div>
            <button type="button" class="adm-btn" [class.adm-btn--danger]="u.is_active" (click)="toggleActive()" [disabled]="isSelf() || busy()">
              {{ u.is_active ? 'Desactivar' : 'Reactivar' }}
            </button>
          </div>
          <div class="danger-zone__row">
            <div>
              <strong>Eliminar cuenta (RGPD)</strong>
              <p class="adm-muted">Anonimiza sus datos personales. Los pedidos se conservan por obligaciones fiscales. No se puede deshacer.</p>
            </div>
            <button type="button" class="adm-btn adm-btn--danger" (click)="remove()" [disabled]="isSelf() || busy()">Eliminar</button>
          </div>
          @if (isSelf()) { <p class="adm-muted">No puedes desactivar ni eliminar tu propia cuenta.</p> }
        </section>
      } @else {
        <div class="adm-empty-state">No se ha encontrado el cliente.</div>
      }
      }
    </div>

    <!-- Edit -->
    @if (editing(); as e) {
      <adm-modal title="Editar cliente" (closed)="editing.set(null)" [closable]="!busy()">
        <div class="adm-form">
          <label class="adm-field"><span>Nombre</span><input type="text" [(ngModel)]="e.first_name" maxlength="100"></label>
          <label class="adm-field"><span>Apellidos</span><input type="text" [(ngModel)]="e.last_name" maxlength="100"></label>
          <label class="adm-field"><span>Email</span><input type="email" [(ngModel)]="e.email"></label>
          <label class="adm-field"><span>Teléfono</span><input type="tel" [(ngModel)]="e.phone" maxlength="20"></label>
          <label class="adm-field">
            <span>Rol</span>
            <select [(ngModel)]="e.role" [disabled]="isSelf()">
              <option value="customer">Cliente</option>
              <option value="admin">Administrador</option>
            </select>
            @if (isSelf()) { <small>No puedes cambiar tu propio rol.</small> }
          </label>
          <div class="adm-field">
            <span>Opciones</span>
            <label class="adm-check"><input type="checkbox" [(ngModel)]="e.is_active" [disabled]="isSelf()"> Cuenta activa</label>
            <label class="adm-check"><input type="checkbox" [(ngModel)]="e.email_verified"> Email verificado</label>
            <label class="adm-check"><input type="checkbox" [(ngModel)]="e.marketing_opt_in"> Acepta comunicaciones comerciales</label>
          </div>
        </div>
        @if (e.role !== user()?.role) {
          <p class="adm-callout">
            {{ e.role === 'admin' ? 'Le darás acceso completo a este panel de administración.' : 'Perderá el acceso al panel de administración.' }}
            Se cerrarán sus sesiones activas.
          </p>
        }
        <div modal-footer>
          <button type="button" class="adm-btn adm-btn--ghost" (click)="editing.set(null)" [disabled]="busy()">Cancelar</button>
          <button type="button" class="adm-btn adm-btn--primary" (click)="saveEdit()" [disabled]="busy()">
            {{ busy() ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </div>
      </adm-modal>
    }

    <!-- Security -->
    @if (showSecurity() && user(); as u) {
      <adm-modal title="Seguridad de la cuenta" (closed)="closeSecurity()" [closable]="!busy()">
        @if (isSelf()) {
          <p class="adm-callout adm-callout--info">Para cambiar tu propia contraseña usa “Mi cuenta → Perfil”.</p>
        } @else {
          <section>
            <h3 class="sec-title">Fijar una contraseña nueva</h3>
            <p class="adm-muted">Útil si el cliente no tiene acceso a su email. Cierra todas sus sesiones.</p>
            <div class="adm-form">
              <label class="adm-field">
                <span>Nueva contraseña</span>
                <input [type]="showPwd() ? 'text' : 'password'" [(ngModel)]="newPassword" autocomplete="new-password">
                <small>Mínimo 8 caracteres, con letras y números.</small>
              </label>
              <div class="adm-field">
                <span>&nbsp;</span>
                <div class="inline-actions">
                  <button type="button" class="adm-btn adm-btn--ghost adm-btn--sm" (click)="generatePassword()">Generar</button>
                  <button type="button" class="adm-btn adm-btn--ghost adm-btn--sm" (click)="showPwd.set(!showPwd())">{{ showPwd() ? 'Ocultar' : 'Mostrar' }}</button>
                </div>
              </div>
            </div>
            <label class="adm-check"><input type="checkbox" [(ngModel)]="notifyUser"> Avisar al cliente por email del cambio</label>
            @if (passwordError()) { <p class="adm-error">{{ passwordError() }}</p> }
            <button type="button" class="adm-btn adm-btn--primary" (click)="setPassword()" [disabled]="busy() || !newPassword">Guardar contraseña</button>
          </section>
          <hr>
          <section class="sec-row">
            <div><strong>Enviar email de restablecimiento</strong><p class="adm-muted">Recibe un enlace válido 1 hora para elegir su contraseña.</p></div>
            <button type="button" class="adm-btn" (click)="run(api.sendUserReset(u.id))" [disabled]="busy() || !u.is_active">Enviar</button>
          </section>
          <section class="sec-row">
            <div><strong>Cerrar todas las sesiones</strong><p class="adm-muted">Tendrá que volver a iniciar sesión en todos sus dispositivos.</p></div>
            <button type="button" class="adm-btn" (click)="run(api.logoutUserEverywhere(u.id))" [disabled]="busy()">Cerrar sesiones</button>
          </section>
        }
        <section class="sec-row">
          <div><strong>Desbloquear inicio de sesión</strong>
            <p class="adm-muted">{{ isLocked() ? 'Bloqueada por intentos fallidos.' : 'Intentos fallidos: ' + u.failed_login_attempts }}</p></div>
          <button type="button" class="adm-btn" (click)="run(api.unlockUser(u.id))" [disabled]="busy() || (!isLocked() && !u.failed_login_attempts)">Desbloquear</button>
        </section>
      </adm-modal>
    }
  `,
  styles: [`
    .back { font-size: 0.85rem; }
    .badges { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.6rem; }
    .timeline { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.9rem; }
    .timeline li { display: flex; gap: 0.75rem; align-items: flex-start; }
    .timeline__icon { flex: none; width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; background: var(--adm-surface-alt); }
    .sub { display: block; color: var(--adm-muted); font-size: 0.75rem; }
    .list article { padding: 0.75rem 0; border-bottom: 1px solid var(--adm-border); &:last-child { border: 0; } p { margin: 0.35rem 0 0; } }
    .list header { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
    .stars { color: #C88A1A; letter-spacing: 1px; }
    .addr { margin: 0; line-height: 1.6; }
    .cart-total { text-align: right; margin: 0.75rem 0 0; }
    .danger-zone { border-color: var(--adm-danger-bg); }
    .danger-zone__row, .sec-row { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0.75rem; padding: 0.6rem 0;
      p { margin: 0.2rem 0 0; font-size: 0.82rem; } }
    .sec-title { margin: 0; font-size: 0.95rem; }
    .inline-actions { display: flex; gap: 0.4rem; flex-wrap: wrap; }
    hr { border: 0; border-top: 1px solid var(--adm-border); margin: 0.5rem 0; width: 100%; }
  `],
})
export class AdminUserDetailComponent implements OnInit {
  api = inject(AdminApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);
  private auth = inject(AuthService);
  private confirm = inject(AdminConfirmService);

  user = signal<AdminUserDetail | null>(null);
  loading = signal(true);
  busy = signal(false);
  tab = signal<Tab>('activity');

  editing = signal<Required<AdminUserUpdate> | null>(null);
  showSecurity = signal(false);
  showPwd = signal(false);
  newPassword = '';
  notifyUser = true;
  passwordError = signal<string | null>(null);

  readonly tabs: { id: Tab; label: string; count: (u: AdminUserDetail) => number | null }[] = [
    { id: 'activity', label: 'Actividad', count: () => null },
    { id: 'orders', label: 'Pedidos', count: u => u.orders.length },
    { id: 'coupons', label: 'Cupones', count: u => u.coupon_redemptions.length },
    { id: 'reviews', label: 'Reseñas', count: u => u.reviews.length },
    { id: 'cart', label: 'Carrito', count: u => u.cart?.item_count ?? 0 },
    { id: 'addresses', label: 'Direcciones', count: u => u.addresses.length },
  ];

  fullName = computed(() => {
    const u = this.user();
    return u ? `${u.first_name} ${u.last_name}`.trim() : '';
  });
  isSelf = computed(() => this.auth.currentUser()?.id === this.user()?.id);
  isLocked = computed(() => {
    const until = this.user()?.locked_until;
    return !!until && new Date(until.endsWith('Z') ? until : until + 'Z') > new Date();
  });

  /** Everything we know about the customer, newest first. */
  timeline = computed<TimelineEvent[]>(() => {
    const u = this.user();
    if (!u) return [];
    const ev: TimelineEvent[] = [{ date: u.created_at, icon: '👤', text: 'Se registró' }];
    if (u.newsletter_lead) {
      ev.push({ date: u.newsletter_lead.created_at, icon: '✉️', text: `Dejó su email en la newsletter (${u.newsletter_lead.source})` });
    }
    if (u.last_login_at) ev.push({ date: u.last_login_at, icon: '🔑', text: 'Último inicio de sesión' });
    for (const o of u.orders) {
      ev.push({
        date: o.created_at, icon: '🛍️',
        text: `Pedido ${o.order_number} · ${o.total.toFixed(2)} € · ${this.orderStatus(o.status).label}`,
        link: ['/admin/orders'], query: { search: o.order_number },
      });
    }
    for (const r of u.coupon_redemptions) {
      ev.push({ date: r.created_at, icon: '🏷️', text: `Usó el cupón ${r.coupon_code} (−${r.discount_amount.toFixed(2)} €)${r.reverted_at ? ' · revertido' : ''}` });
    }
    for (const r of u.reviews) {
      ev.push({ date: r.created_at, icon: '⭐', text: `Reseña de ${r.rating}★ en ${r.product_name}`, link: ['/admin/resenas'], query: { status: r.status } });
    }
    if (u.cart) {
      ev.push({ date: u.cart.updated_at, icon: '🛒', text: `Carrito con ${u.cart.item_count} artículos (${u.cart.subtotal.toFixed(2)} €) sin comprar` });
    }
    return ev.sort((a, b) => b.date.localeCompare(a.date));
  });

  ngOnInit(): void {
    this.load();
  }

  orderStatus(s: string) { return statusInfo(ORDER_STATUS, s); }
  reviewStatus(s: string) { return statusInfo(REVIEW_STATUS, s); }

  load(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.user(id).subscribe({
      next: u => { this.user.set(u); this.loading.set(false); },
      error: err => {
        this.loading.set(false);
        this.toast.error(err.message || 'No se pudo cargar el cliente');
      },
    });
  }

  openEdit(): void {
    const u = this.user()!;
    this.editing.set({
      email: u.email, first_name: u.first_name, last_name: u.last_name, phone: u.phone ?? '',
      role: u.role, is_active: u.is_active, email_verified: u.email_verified, marketing_opt_in: u.marketing_opt_in,
    });
  }

  async saveEdit(): Promise<void> {
    const e = this.editing();
    const u = this.user();
    if (!e || !u) return;

    if (e.role !== u.role) {
      const ok = await this.confirm.ask({
        title: e.role === 'admin' ? '¿Hacer administrador?' : '¿Quitar permisos de administrador?',
        message: e.role === 'admin'
          ? `${u.email} tendrá acceso completo al panel: pedidos, clientes, cupones…`
          : `${u.email} dejará de poder entrar en el panel de administración.`,
        confirmText: 'Sí, cambiar rol',
        danger: e.role === 'admin',
      });
      if (!ok) return;
    }

    // Send only what changed
    const changes: AdminUserUpdate = {};
    (Object.keys(e) as (keyof AdminUserUpdate)[]).forEach(k => {
      const value = k === 'phone' ? (e.phone || null) : e[k];
      if (value !== (u as unknown as Record<string, unknown>)[k]) (changes as Record<string, unknown>)[k] = value;
    });
    if (!Object.keys(changes).length) {
      this.editing.set(null);
      return;
    }
    this.run(this.api.updateUser(u.id, changes), () => this.editing.set(null));
  }

  async toggleActive(): Promise<void> {
    const u = this.user()!;
    if (u.is_active) {
      const ok = await this.confirm.ask({
        title: '¿Desactivar la cuenta?',
        message: `${u.email} no podrá iniciar sesión y se cerrarán sus sesiones abiertas.`,
        confirmText: 'Desactivar', danger: true,
      });
      if (!ok) return;
    }
    this.run(this.api.setUserActive(u.id, !u.is_active));
  }

  async remove(): Promise<void> {
    const u = this.user()!;
    const ok = await this.confirm.ask({
      title: '¿Eliminar esta cuenta?',
      message: `Se anonimizarán los datos personales de ${u.email} (nombre, email, teléfono) y no podrá volver a entrar.\n` +
        'Sus pedidos se conservan por obligaciones fiscales. Esta acción no se puede deshacer.',
      confirmText: 'Eliminar definitivamente', danger: true,
    });
    if (!ok) return;
    this.busy.set(true);
    this.api.deleteUser(u.id).subscribe({
      next: res => {
        this.busy.set(false);
        this.toast.success(res.message);
        this.router.navigate(['/admin/clientes']);
      },
      error: err => {
        this.busy.set(false);
        this.toast.error(err.message || 'No se pudo eliminar');
      },
    });
  }

  generatePassword(): void {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
    const bytes = new Uint32Array(12);
    crypto.getRandomValues(bytes);
    let pwd = Array.from(bytes, b => chars[b % chars.length]).join('');
    if (!/\d/.test(pwd)) pwd = pwd.slice(0, -1) + '7';
    this.newPassword = pwd;
    this.showPwd.set(true);
  }

  setPassword(): void {
    const pwd = this.newPassword;
    if (pwd.length < 8 || !/[A-Za-z]/.test(pwd) || !/\d/.test(pwd)) {
      this.passwordError.set('Mínimo 8 caracteres, con al menos una letra y un número.');
      return;
    }
    this.passwordError.set(null);
    this.run(this.api.setUserPassword(this.user()!.id, pwd, this.notifyUser), () => {
      this.newPassword = '';
      this.showPwd.set(false);
    });
  }

  closeSecurity(): void {
    this.showSecurity.set(false);
    this.newPassword = '';
    this.passwordError.set(null);
  }

  /** Runs an action, shows the API message and reloads the profile. */
  run(req: Observable<ApiMessage>, after?: () => void): void {
    this.busy.set(true);
    req.subscribe({
      next: res => {
        this.busy.set(false);
        this.toast.success(res.message);
        after?.();
        this.load();
      },
      error: err => {
        this.busy.set(false);
        this.toast.error(err.message || 'No se pudo completar la acción');
      },
    });
  }
}
