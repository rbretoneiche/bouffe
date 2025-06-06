import {Component, ViewChild} from '@angular/core';
import {Country, MapComponent} from './components/map.component';
import {FormsModule} from '@angular/forms';
import {CountryService, SqlCountry} from './services/country.service';
import {Observable} from 'rxjs';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-root',
  template: `
    <div class="container">
      @if (!submitted) {
        <div class="header">
          <h1>BOUFFE</h1>


          <div class="input-section">
            <div class="row">
              <div class="input-group">
                <span style="align-self: center">Dernier pays visité: </span>
                <input
                  disabled
                  type="text"
                  [(ngModel)]="inputCountry"
                  placeholder="Entrez un pays de référence (ex: France)"
                  class="country-input"
                  (keyup.enter)="generateDistantCountries()"
                >
              </div>

              <button
                class="btn-generate"
                (click)="generateDistantCountries()"
                [disabled]="!inputCountry.trim() || isLoading"
              >
                @if (isLoading) {
                  <span class="spinner"></span>
                  <span class="suspense-text">{{ suspenseMessage }}</span>
                } @else if (!selectedCountries.length) {
                  🌍 Trouver 3 pays distants
                } @else {
                  🌍 Recommencer
                }
              </button>
            </div>
          </div>

          @if (errorMessage) {
            <div class="error-message">
              {{ errorMessage }}
            </div>
          }
        </div>

        @if (selectedCountries.length > 0) {
          <div class="countries-list">
            <h3>Pays trouvés (distants de {{ inputCountry }}) :</h3>
            <div class="row">
              <div class="country-cards">
                @for (country of selectedCountries; track country.name; let i = $index) {
                  <div class="country-card" (click)="selectedCountry = (country)">
                    <div class="country-number"
                         [ngClass]="{'selected' : selectedCountry?.name === country.name}">{{ i + 1 }}
                    </div>
                    <div class="country-info">
                      <span class="country-name">{{ country.name }}</span>
                      @if (country.distance) {
                        <span class="country-distance">{{ Math.round(country.distance) }} km</span>
                      }
                    </div>                      @if (country.flag) {
                    <img [src]="country.flag">
                  }

                  </div>
                }
              </div>
              <button
                class="btn-go"
                (click)="selectCountry()"
              >
                @if (isLoading) {
                  <span class="spinner"></span>
                }
                Go !
              </button>

            </div>
          </div>
        }

        <app-map
          #mapComponent
          [selectedCountries]="selectedCountries"
          [selectedCountry]="selectedCountry">
        </app-map>
      } @else {
        <div class="header">
          <h1>BOUFFE</h1>
          <h2>Félicitation, votre prochaine bouffe sera sur le thème du : {{ selectedCountry?.name }}</h2>
          <img [src]="selectedCountry?.flag">
          <button class="btn-generate" style="justify-self: center" (click)="reset()">Retour en arrière</button>
        </div>
      }
    </div>
  `,
  imports: [
    MapComponent,
    FormsModule,
    NgClass
  ],
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
    }

    .header h1 {
      color: #333;
      margin-bottom: 30px;
    }

    .input-section {
      margin-bottom: 20px;
    }

    .input-group {
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .country-input {
      padding: 12px 16px;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      font-size: 16px;
      min-width: 250px;
      transition: border-color 0.2s;
    }

    .country-input:focus {
      outline: none;
      border-color: #4ECDC4;
    }

    .distance-input {
      padding: 12px 16px;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      font-size: 16px;
      width: 150px;
      transition: border-color 0.2s;
    }

    .distance-input:focus {
      outline: none;
      border-color: #4ECDC4;
    }

    .btn-generate {
      background: linear-gradient(45deg, #FF6B6B, #FFD93D);
      color: white;
      border: none;
      padding: 15px 30px;
      border-radius: 25px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .btn-generate:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
    }

    .btn-generate:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .btn-go {
      background: linear-gradient(45deg, #6bcbff, #FFD93D);
      color: white;
      border: none;
      padding: 15px 30px;
      border-radius: 25px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .btn-go:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
    }

    .btn-go:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

    .error-message {
      background: #ffe6e6;
      color: #d63031;
      padding: 12px 20px;
      border-radius: 8px;
      margin: 15px auto;
      max-width: 500px;
      border-left: 4px solid #d63031;
    }

    .row {
      display: flex;
      gap: 1rem;
      justify-content: center;
      align-items: center;
    }

    .countries-list {
      margin-bottom: 30px;
    }

    .countries-list h3 {
      color: #333;
      margin-bottom: 15px;
      text-align: center;
    }

    .country-cards {
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .country-card {
      background: white;
      padding: 15px 20px;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 15px;
      transition: transform 0.2s;
      min-width: 200px;
      cursor: pointer;
    }

    .country-card:hover {
      transform: translateY(-2px);
    }

    .country-card img{
      width: 50px;
      height: auto;
    }

    .country-number {
      background: #FF6B6B;
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
      flex-shrink: 0;
    }

    .selected {
      background: #706bff;
    }

    .country-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .country-name {
      font-weight: 600;
      color: #333;
      font-size: 16px;
    }

    .country-distance {
      font-size: 12px;
      color: #666;
      background: #f8f9fa;
      padding: 2px 8px;
      border-radius: 12px;
      align-self: flex-start;
    }

    @media (max-width: 768px) {
      .input-group {
        flex-direction: column;
        align-items: center;
      }

      .country-input {
        min-width: 200px;
      }

      .country-cards {
        flex-direction: column;
        align-items: center;
      }

      .country-card {
        min-width: 250px;
      }
    }
  `]
})
export class AppComponent {
  @ViewChild('mapComponent') mapComponent!: MapComponent;

  selectedCountries: Country[] = [];
  inputCountry: string = '';
  minDistance: number = 1500;
  isLoading: boolean = false;
  errorMessage: string = '';
  suspenseMessage: string = '';
  doneCountry$: Observable<SqlCountry>;
  // Expose Math pour le template
  Math = Math;
  selectedCountry: Country | null = null;
  submitted = false;

  constructor(private countryService: CountryService) {
    this.doneCountry$ = this.countryService.getDoneCountry();
    this.doneCountry$.pipe().subscribe((country) => this.inputCountry = country.name)
  }

  generateDistantCountries(): void {
    if (!this.inputCountry.trim()) {
      this.errorMessage = 'Veuillez entrer un pays de référence.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.selectedCountries = [];
    // Messages de suspense qui changent pendant l'animation
    const suspenseMessages = [
      '🔍 Recherche de pays lointains...',
      '🌍 Exploration de la planète...',
      '📍 Sélection des destinations...',
      '✨ Finalisation des choix...'
    ];

    let messageIndex = 0;
    this.suspenseMessage = suspenseMessages[0];

    // Démarrer l'animation de suspense sur la carte
    this.mapComponent.startSuspenseAnimation();

    // Changer les messages pendant l'animation
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % suspenseMessages.length;
      this.suspenseMessage = suspenseMessages[messageIndex];
    }, 1250);

    // Faire l'appel API en parallèle mais attendre 5 secondes minimum
    const apiCall = this.countryService.getDistantCountries(
      this.inputCountry.trim(),
      this.minDistance,
      3
    );

    const suspenseDelay = new Promise(resolve => setTimeout(resolve, 5000));

    // Attendre à la fois l'API et le délai de suspense
    Promise.all([apiCall.toPromise(), suspenseDelay])
      .then(([countries]) => {
        // Arrêter l'animation et les messages
        clearInterval(messageInterval);
        this.mapComponent.stopSuspenseAnimation();

        // Mapper les résultats
        this.selectedCountries = (countries || []).map(country => ({
          name: country.name,
          lat: country.lat2,
          lng: country.lon2,
          distance: country.distance,
          flag: country.flag
        }));

        if (this.selectedCountries.length === 0) {
          this.errorMessage = `Aucun pays trouvé à plus de ${this.minDistance}km de "${this.inputCountry}". Essayez avec une distance plus petite.`;
        }

        this.isLoading = false;
        this.suspenseMessage = '';
      })
      .catch((error) => {
        clearInterval(messageInterval);
        this.mapComponent.stopSuspenseAnimation();
        console.error('Erreur lors de la recherche:', error);
        this.errorMessage = `Pays "${this.inputCountry}" non trouvé. Vérifiez l'orthographe.`;
        this.isLoading = false;
        this.suspenseMessage = '';
      });
  }

  selectCountry() {
    if (this.selectedCountry && this.selectedCountry.name !== '') {
      this.isLoading = true;
      this.countryService.postNextCountry(this.selectedCountry.name).subscribe(() => {
        this.submitted = true;
        this.isLoading = false;

      })
    }

  }

  reset() {
    this.submitted = false;
    this.inputCountry = this.selectedCountry?.name ?? '';
    this.selectedCountry = null;
    this.selectedCountries = [];
  }
}
