import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="footer">
      <div class="container">
        <div class="footer__grid">
          <!-- About -->
          <div class="footer__section">
            <h3 class="footer__title">Cremacuadrado</h3>
            <p class="footer__text">
              Crema de pistacho artesanal elaborada con los mejores pistachos de Sicilia. 
              100% natural, sin aditivos. El sabor auténtico del pistacho.
            </p>
          </div>
          
          <!-- Links -->
          <div class="footer__section">
            <h3 class="footer__title">Enlaces</h3>
            <nav class="footer__nav">
              <a routerLink="/tienda">Tienda</a>
              <a routerLink="/el-archivo">Blog</a>
              <a routerLink="/nuestro-metodo">Sobre nosotros</a>
              <a routerLink="/devoluciones">Envíos</a>
            </nav>
          </div>
          
          <!-- Legal -->
          <div class="footer__section">
            <h3 class="footer__title">Legal</h3>
            <nav class="footer__nav">
              <a routerLink="/privacidad">Política de privacidad</a>
              <a routerLink="/condiciones-venta">Condiciones de uso</a>
              <a routerLink="/cookies">Política de cookies</a>
            </nav>
          </div>
          
          <!-- Contact -->
          <div class="footer__section">
            <h3 class="footer__title">Contacto</h3>
            <div class="footer__contact">
              <p>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                info&#64;cremacuadrado.com
              </p>
              <p>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Madrid, España
              </p>
            </div>
            
            <!-- Social -->
            <div class="footer__social">
              <a href="https://instagram.com" target="_blank" rel="noopener" aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener" aria-label="Facebook">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener" aria-label="Twitter">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
        
        <div class="footer__bottom">
          <p>&copy; {{ currentYear }} Cremacuadrado. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: #1A1208;
      color: #F4F1E9;
      padding: 3.5rem 0 1.25rem;
      margin-top: auto;
    }
    
    .container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }
    
    .footer__grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2.5rem;
      margin-bottom: 2.5rem;
    }
    
    .footer__title {
      font-family: 'Poppins', sans-serif;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: #E6C15A;
      margin-bottom: 1rem;
    }
    
    .footer__text {
      font-family: 'Lora', serif;
      color: rgba(244, 241, 233, 0.6);
      font-size: 0.875rem;
      line-height: 1.7;
    }
    
    .footer__nav {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      
      a {
        font-family: 'Poppins', sans-serif;
        color: rgba(244, 241, 233, 0.6);
        text-decoration: none;
        font-size: 0.8rem;
        font-weight: 300;
        transition: color 150ms ease;
        
        &:hover {
          color: #E6C15A;
        }
      }
    }
    
    .footer__contact {
      p {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-family: 'Poppins', sans-serif;
        color: rgba(244, 241, 233, 0.6);
        font-size: 0.8rem;
        font-weight: 300;
        margin-bottom: 0.5rem;
        
        svg {
          flex-shrink: 0;
          color: #E6C15A;
        }
      }
    }
    
    .footer__social {
      display: flex;
      gap: 1rem;
      margin-top: 1.25rem;
      
      a {
        color: rgba(244, 241, 233, 0.5);
        transition: color 150ms ease;
        
        &:hover {
          color: #E6C15A;
        }
      }
    }
    
    .footer__bottom {
      border-top: 1px solid rgba(244, 241, 233, 0.1);
      padding-top: 1.25rem;
      text-align: center;
      
      p {
        font-family: 'Poppins', sans-serif;
        color: rgba(244, 241, 233, 0.3);
        font-size: 0.75rem;
        font-weight: 300;
        letter-spacing: 0.04em;
        margin: 0;
      }
    }
  `]
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
