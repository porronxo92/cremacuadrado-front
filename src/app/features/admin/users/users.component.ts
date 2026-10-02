import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { AdminUser, Order } from '../../../core/models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-users">
      <div class="page-header">
        <h1>Gestión de Clientes</h1>
        <p class="subtitle">Gestiona los clientes registrados en la plataforma</p>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filter-group">
          <label>Buscar:</label>
          <input 
            type="text" 
            [(ngModel)]="searchTerm" 
            placeholder="Email, nombre o teléfono..." 
            (keyup.enter)="onSearch()">
        </div>

        <div class="filter-group">
          <label>Rol:</label>
          <select [(ngModel)]="roleFilter" (change)="onSearch()">
            <option value="">Todos los roles</option>
            <option value="customer">Cliente</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Estado:</label>
          <select [(ngModel)]="statusFilter" (change)="onSearch()">
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

        <button class="btn btn--primary" (click)="onSearch()">Buscar</button>
        <button class="btn btn--secondary" (click)="resetFilters()">Limpiar</button>
      </div>

      <!-- Loading state -->
      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Cargando clientes...</p>
        </div>
      } @else {
        <!-- Table -->
        <div class="table-container">
          <table class="users-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Pedidos</th>
                <th>Gastado</th>
                <th>Estado</th>
                <th>Registrado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr>
                  <td>
                    <span class="email-badge">{{ user.email }}</span>
                  </td>
                  <td>{{ user.first_name }} {{ user.last_name }}</td>
                  <td>{{ user.phone || '—' }}</td>
                  <td>
                    <span class="role-badge" [class]="'role--' + user.role">
                      {{ user.role === 'admin' ? 'Administrador' : 'Cliente' }}
                    </span>
                  </td>
                  <td class="text-center">
                    <strong>{{ user.total_orders }}</strong>
                  </td>
                  <td class="text-right">
                    {{ user.total_spent | currency:'EUR':'symbol':'1.2-2' }}
                  </td>
                  <td>
                    <span class="status-badge" [class]="'status--' + (user.is_active ? 'active' : 'inactive')">
                      {{ user.is_active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td>{{ user.created_at | date:'dd/MM/yyyy' }}</td>
                  <td class="actions">
                    <button 
                      class="btn btn--icon" 
                      (click)="viewProfile(user)" 
                      title="Ver perfil">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </button>
                    @if (user.total_orders > 0) {
                      <button 
                        class="btn btn--icon" 
                        (click)="viewOrders(user)" 
                        title="Ver pedidos">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="9" cy="21" r="1"></circle>
                          <circle cx="20" cy="21" r="1"></circle>
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                      </button>
                    }
                    <button 
                      class="btn btn--icon" 
                      (click)="toggleUserStatus(user)" 
                      [disabled]="isSelf(user)"
                      [title]="user.is_active ? 'Desactivar' : 'Activar'">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path>
                      </svg>
                    </button>
                    <button 
                      class="btn btn--icon btn--danger" 
                      (click)="deleteUser(user)" 
                      [disabled]="isSelf(user)"
                      title="Eliminar usuario">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="9" class="empty">No hay clientes</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="pagination">
            <button 
              class="btn btn--secondary" 
              (click)="goToPage(currentPage() - 1)" 
              [disabled]="currentPage() === 1">
              ← Anterior
            </button>
            <div class="page-info">
              Página <strong>{{ currentPage() }}</strong> de <strong>{{ totalPages() }}</strong>
              <span class="total-count">(Total: {{ total() }} clientes)</span>
            </div>
            <button 
              class="btn btn--secondary" 
              (click)="goToPage(currentPage() + 1)" 
              [disabled]="currentPage() === totalPages()">
              Siguiente →
            </button>
          </div>
        }
      }

      <!-- Profile Modal -->
      @if (selectedUser()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal modal--large" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Perfil de Cliente</h2>
              <button class="close-btn" (click)="closeModal()">×</button>
            </div>

            <div class="modal-body">
              <div class="user-info">
                <div class="info-row">
                  <label>Email:</label>
                  <span class="info-value">{{ selectedUser()!.email }}</span>
                  @if (selectedUser()!.email_verified) {
                    <span class="badge badge--success">Verificado</span>
                  }
                </div>

                <div class="info-row">
                  <label>Nombre:</label>
                  <span class="info-value">{{ selectedUser()!.first_name }} {{ selectedUser()!.last_name }}</span>
                </div>

                <div class="info-row">
                  <label>Teléfono:</label>
                  <span class="info-value">{{ selectedUser()!.phone || '—' }}</span>
                </div>

                <div class="info-row">
                  <label>Rol:</label>
                  <span class="info-value">
                    <span class="role-badge" [class]="'role--' + selectedUser()!.role">
                      {{ selectedUser()!.role === 'admin' ? 'Administrador' : 'Cliente' }}
                    </span>
                  </span>
                </div>

                <div class="info-row">
                  <label>Estado:</label>
                  <span class="info-value">
                    <span class="status-badge" [class]="'status--' + (selectedUser()!.is_active ? 'active' : 'inactive')">
                      {{ selectedUser()!.is_active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </span>
                </div>

                <div class="info-row">
                  <label>Suscripción a Marketing:</label>
                  <span class="info-value">
                    {{ selectedUser()!.marketing_opt_in ? 'Sí' : 'No' }}
                  </span>
                </div>

                <div class="info-row">
                  <label>Registrado:</label>
                  <span class="info-value">{{ selectedUser()!.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>

                <hr class="divider">

                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-value">{{ selectedUser()!.total_orders }}</div>
                    <div class="stat-label">Pedidos</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-value">{{ selectedUser()!.total_spent | currency:'EUR':'symbol':'1.2-2' }}</div>
                    <div class="stat-label">Gastado</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button 
                class="btn btn--primary" 
                [disabled]="isSelf(selectedUser()!)"
                (click)="toggleUserStatus(selectedUser()!)">
                {{ selectedUser()!.is_active ? 'Desactivar Usuario' : 'Activar Usuario' }}
              </button>
              <button class="btn btn--secondary" (click)="closeModal()">Cerrar</button>
            </div>
          </div>
        </div>
      }

      <!-- Orders Modal -->
      @if (selectedUserForOrders()) {
        <div class="modal-overlay" (click)="closeOrdersModal()">
          <div class="modal modal--large" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Pedidos de {{ selectedUserForOrders()?.first_name }} {{ selectedUserForOrders()?.last_name }}</h2>
              <button class="close-btn" (click)="closeOrdersModal()">×</button>
            </div>

            <div class="modal-body">
              <div class="orders-list">
                @if (loadingOrders()) {
                  <div class="loading-small">Cargando pedidos...</div>
                } @else {
                  @for (order of selectedUserOrders(); track order.id) {
                    <div class="order-card">
                      <div class="order-header">
                        <div class="order-number">
                          <strong>Pedido #{{ order.order_number }}</strong>
                          <span class="order-date">{{ order.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                        </div>
                        <div class="order-total">
                          {{ order.total | currency:'EUR':'symbol':'1.2-2' }}
                        </div>
                      </div>
                      <div class="order-details">
                        <span class="status-badge" [class]="'status--' + order.status">
                          {{ getOrderStatusLabel(order.status) }}
                        </span>
                        <span class="item-count">{{ order.item_count }} artículo{{ order.item_count > 1 ? 's' : '' }}</span>
                      </div>
                    </div>
                  }
                }
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn btn--secondary" (click)="closeOrdersModal()">Cerrar</button>
            </div>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (userToDelete()) {
        <div class="modal-overlay" (click)="cancelDelete()">
          <div class="modal modal--small" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Eliminar Usuario</h2>
              <button class="close-btn" (click)="cancelDelete()">×</button>
            </div>

            <div class="modal-body">
              <p class="warning-text">
                ¿Estás seguro de que deseas eliminar a <strong>{{ userToDelete()!.email }}</strong>?
              </p>
              <p class="warning-subtext">
                Esta acción es irreversible y se eliminarán todos sus datos asociados.
              </p>
            </div>

            <div class="modal-footer">
              <button 
                class="btn btn--danger" 
                (click)="confirmDelete()"
                [disabled]="deleting()">
                {{ deleting() ? 'Eliminando...' : 'Sí, eliminar' }}
              </button>
              <button 
                class="btn btn--secondary" 
                (click)="cancelDelete()"
                [disabled]="deleting()">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-users {
      padding: 2rem;
      background: #f8f8f8;
      min-height: 100vh;
    }

    .page-header {
      margin-bottom: 2rem;

      h1 {
        margin: 0 0 0.5rem 0;
        font-size: 1.8rem;
        color: #1c1a14;
      }

      .subtitle {
        margin: 0;
        color: #6b6456;
        font-size: 0.95rem;
      }
    }

    .filters-section {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
      min-width: 200px;

      label {
        font-size: 0.85rem;
        font-weight: 500;
        color: #1c1a14;
      }

      input, select {
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 0.9rem;

        &:focus {
          outline: none;
          border-color: #7b1716;
          box-shadow: 0 0 0 2px rgba(123, 23, 22, 0.1);
        }
      }
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;

      &--primary {
        background: #7b1716;
        color: white;

        &:hover:not(:disabled) {
          background: #5f1210;
        }
      }

      &--secondary {
        background: #ede9df;
        color: #1c1a14;
        border: 1px solid #ddd;

        &:hover:not(:disabled) {
          background: #e0d9cc;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      &--icon {
        width: 36px;
        height: 36px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f4f1e9;
        color: #1c1a14;
        border: 1px solid #ddd;
        border-radius: 4px;

        &:hover {
          background: #ede9df;
        }
      }

      &--danger {
        color: #c41c00;

        &:hover {
          background: rgba(196, 28, 0, 0.1);
        }
      }
    }

    .loading {
      background: white;
      padding: 3rem;
      border-radius: 8px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;

      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #ddd;
        border-top-color: #7b1716;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }

      p {
        margin: 0;
        color: #6b6456;
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .table-container {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      margin-bottom: 2rem;
    }

    .users-table {
      width: 100%;
      border-collapse: collapse;

      thead {
        background: #f4f1e9;

        tr {
          border-bottom: 1px solid #ddd;
        }

        th {
          padding: 1rem;
          text-align: left;
          font-size: 0.85rem;
          font-weight: 600;
          color: #1c1a14;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      }

      tbody {
        tr {
          border-bottom: 1px solid #eee;
          transition: background 0.2s ease;

          &:hover {
            background: #fafaf8;
          }
        }

        td {
          padding: 1rem;
          font-size: 0.9rem;
          color: #1c1a14;

          &.text-center {
            text-align: center;
          }

          &.text-right {
            text-align: right;
          }

          &.empty {
            text-align: center;
            color: #6b6456;
            padding: 2rem;
          }
        }
      }
    }

    .email-badge {
      background: #f4f1e9;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 500;
      font-family: monospace;
    }

    .role-badge {
      display: inline-block;
      padding: 0.35rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;

      &.role--admin {
        background: #f5a542;
        color: white;
      }

      &.role--customer {
        background: #a2ba1c;
        color: white;
      }
    }

    .status-badge {
      display: inline-block;
      padding: 0.35rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;

      &.status--active {
        background: #a2ba1c;
        color: white;
      }

      &.status--inactive {
        background: #999;
        color: white;
      }

      &.status--pending {
        background: #f5a542;
        color: white;
      }

      &.status--processing {
        background: #4a7c4e;
        color: white;
      }

      &.status--shipped {
        background: #7b1716;
        color: white;
      }

      &.status--delivered {
        background: #a2ba1c;
        color: white;
      }

      &.status--cancelled {
        background: #999;
        color: white;
      }
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .pagination {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

      .page-info {
        color: #6b6456;
        font-size: 0.9rem;

        .total-count {
          margin-left: 0.5rem;
          opacity: 0.7;
          font-size: 0.85rem;
        }
      }
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal {
      background: white;
      border-radius: 8px;
      max-width: 600px;
      width: 100%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

      &--small {
        max-width: 400px;
      }

      &--large {
        max-width: 700px;
      }
    }

    .modal-header {
      padding: 1.5rem;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;

      h2 {
        margin: 0;
        font-size: 1.3rem;
        color: #1c1a14;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 1.8rem;
        color: #999;
        cursor: pointer;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
          color: #1c1a14;
        }
      }
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-footer {
      padding: 1.5rem;
      border-top: 1px solid #eee;
      display: flex;
      gap: 1rem;
      justify-content: flex-end;

      .btn {
        flex: 1;

        @media (max-width: 600px) {
          flex: auto;
        }
      }
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 1rem;

      label {
        min-width: 140px;
        font-weight: 600;
        color: #1c1a14;
      }

      .info-value {
        flex: 1;
        color: #6b6456;
      }

      .badge {
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 500;

        &--success {
          background: #a2ba1c;
          color: white;
        }
      }
    }

    .divider {
      border: none;
      border-top: 1px solid #eee;
      margin: 1.5rem 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .stat-card {
      background: #f4f1e9;
      padding: 1.5rem;
      border-radius: 8px;
      text-align: center;

      .stat-value {
        font-size: 1.8rem;
        font-weight: 600;
        color: #7b1716;
      }

      .stat-label {
        margin-top: 0.5rem;
        font-size: 0.85rem;
        color: #6b6456;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .loading-small {
        text-align: center;
        padding: 2rem;
        color: #6b6456;
      }
    }

    .order-card {
      background: #f8f8f8;
      border: 1px solid #eee;
      border-radius: 6px;
      padding: 1rem;
      transition: all 0.2s ease;

      &:hover {
        border-color: #ddd;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;

      .order-number {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        strong {
          color: #1c1a14;
        }

        .order-date {
          font-size: 0.8rem;
          color: #6b6456;
        }
      }

      .order-total {
        font-weight: 600;
        color: #7b1716;
        font-size: 1.1rem;
      }
    }

    .order-details {
      display: flex;
      gap: 0.75rem;
      align-items: center;

      .item-count {
        font-size: 0.85rem;
        color: #6b6456;
      }
    }

    .warning-text {
      margin: 0 0 1rem 0;
      color: #1c1a14;
      font-size: 0.95rem;

      strong {
        color: #7b1716;
      }
    }

    .warning-subtext {
      margin: 0;
      color: #6b6456;
      font-size: 0.85rem;
    }

    @media (max-width: 768px) {
      .filters-section {
        flex-direction: column;
      }

      .filter-group {
        min-width: 100%;
      }

      .table-container {
        overflow-x: auto;
      }

      .users-table {
        font-size: 0.85rem;

        th, td {
          padding: 0.75rem 0.5rem;
        }
      }

      .pagination {
        flex-direction: column;
        text-align: center;
      }

      .modal {
        max-width: 90%;
        max-height: 90vh;
      }
    }
  `]
})
export class AdminUsersComponent implements OnInit {
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  // Signals
  users = signal<AdminUser[]>([]);
  loading = signal(false);
  currentPage = signal(1);
  totalPages = signal(1);
  total = signal(0);
  
  searchTerm = '';
  roleFilter = '';
  statusFilter = '';

  selectedUser = signal<AdminUser | null>(null);
  selectedUserOrders = signal<Order[]>([]);
  selectedUserForOrders = signal<AdminUser | null>(null);
  loadingOrders = signal(false);
  
  userToDelete = signal<AdminUser | null>(null);
  deleting = signal(false);

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers(page: number = 1) {
    this.loading.set(true);
    this.currentPage.set(page);

    this.userService.getAdminUsers(
      page,
      20,
      this.searchTerm,
      this.roleFilter,
      this.statusFilter
    ).subscribe({
      next: (response) => {
        this.users.set(response.data);
        this.totalPages.set(response.pages);
        this.total.set(response.total);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.toastService.error('Error al cargar los clientes');
        this.loading.set(false);
      }
    });
  }

  onSearch() {
    this.currentPage.set(1);
    this.loadUsers(1);
  }

  resetFilters() {
    this.searchTerm = '';
    this.roleFilter = '';
    this.statusFilter = '';
    this.loadUsers(1);
  }

  goToPage(page: number) {
    if (page > 0 && page <= this.totalPages()) {
      this.loadUsers(page);
    }
  }

  viewProfile(user: AdminUser) {
    this.selectedUser.set(user);
  }

  closeModal() {
    this.selectedUser.set(null);
  }

  viewOrders(user: AdminUser) {
    if (user.order_ids.length === 0) {
      this.toastService.info('Este usuario no tiene pedidos');
      return;
    }

    this.selectedUserForOrders.set(user);
    this.selectedUserOrders.set([]);
    this.loadingOrders.set(true);

    // /admin/orders no filtra por usuario: se busca por email y se cruza con order_ids
    const url = `${environment.apiUrl}/admin/orders?page=1&limit=100&search=${encodeURIComponent(user.email)}`;
    this.http.get<{ items: Order[] }>(url).subscribe({
      next: (response) => {
        this.selectedUserOrders.set(response.items.filter(o => user.order_ids.includes(o.id)));
        this.loadingOrders.set(false);
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.toastService.error('Error al cargar los pedidos');
        this.loadingOrders.set(false);
      }
    });
  }

  closeOrdersModal() {
    this.selectedUserOrders.set([]);
    this.selectedUserForOrders.set(null);
  }

  isSelf(user: AdminUser): boolean {
    return this.authService.currentUser()?.id === user.id;
  }

  toggleUserStatus(user: AdminUser) {
    const isActive = !user.is_active;

    this.userService.updateUserStatus(user.id, isActive).subscribe({
      next: () => {
        const updated = { ...user, is_active: isActive };
        this.users.update(list => list.map(u => (u.id === user.id ? updated : u)));
        if (this.selectedUser()?.id === user.id) {
          this.selectedUser.set(updated);
        }
        this.toastService.success(`Usuario ${isActive ? 'activado' : 'desactivado'} correctamente`);
      },
      error: (error) => {
        console.error('Error updating user status:', error);
        this.toastService.error('Error al actualizar el estado');
      }
    });
  }

  deleteUser(user: AdminUser) {
    this.userToDelete.set(user);
  }

  cancelDelete() {
    this.userToDelete.set(null);
  }

  confirmDelete() {
    const user = this.userToDelete();
    if (!user) return;

    this.deleting.set(true);

    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.toastService.success('Usuario eliminado correctamente');
        this.userToDelete.set(null);
        this.deleting.set(false);
        this.loadUsers(this.currentPage());
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.toastService.error('Error al eliminar el usuario');
        this.deleting.set(false);
      }
    });
  }

  getOrderStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pendiente',
      'paid': 'Pagado',
      'processing': 'En proceso',
      'shipped': 'Enviado',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado',
      'refunded': 'Reembolsado'
    };
    return labels[status] || status;
  }
}
