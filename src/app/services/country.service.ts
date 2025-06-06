import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {forkJoin, map} from 'rxjs';
import {environment} from '../../environments/environment';

export interface SqlCountry {
  name: string
}

@Injectable({providedIn: 'root'})
export class CountryService {
  private baseUrl = 'https://restcountries.com/v3.1';
  private apiBaseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
  }

  // Formule de Haversine
  private getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  getDistantCountries(inputCountry: string | null = null, minDistanceKm = 1500, count = 3, allSqlCountries: SqlCountry[] = []) {
    const allCountries$ = this.http.get<any[]>(`${this.baseUrl}/all?fields=name,latlng,flags`);
    const allSqlCountriesStrings = allSqlCountries.flatMap(country => country.name);
    // Si pas de pays de référence, on récupère juste tous les pays
    if (!inputCountry || inputCountry.trim() === '') {
      return allCountries$.pipe(
        map(allCountries => {
          // Filtrer les pays avec coordonnées valides
          const validCountries = allCountries
            .filter(c => c.latlng && c.latlng.length === 2)
            .filter(c => !allSqlCountriesStrings.includes(c.name.common))
            .map(c => ({
              name: c.name.common,
              lat2: c.latlng[0],
              lon2: c.latlng[1],
              flag: c.flags.svg,
              distance: null // Pas de distance de référence
            }));

          // Sélectionner des pays éloignés les uns des autres
          return this.selectDistantCountries(validCountries, minDistanceKm, count);
        })
      );
    }

    // Logique existante avec pays de référence
    const targetCountry$ = this.http.get<any[]>(`${this.baseUrl}/name/${inputCountry}`);

    return forkJoin([targetCountry$, allCountries$]).pipe(
      map(([targetData, allCountries]) => {
        const target = targetData[0];
        const [lat1, lon1] = target.latlng;

        const distantCountries = allCountries
          .filter(c => c.name.common !== target.name.common && c.latlng)
          .map(c => {
            const [lat2, lon2] = c.latlng;
            const distance = this.getDistance(lat1, lon1, lat2, lon2);
            return {name: c.name.common, distance, lat2, lon2, flag: c.flags.svg};
          })
          .filter(c => c.distance >= minDistanceKm)
          .sort(() => Math.random() - 0.5); // shuffle

        return distantCountries.slice(0, count);
      })
    );
  }

  /**
   * Sélectionne des pays qui sont éloignés les uns des autres
   */
  private selectDistantCountries(countries: any[], minDistanceKm: number, count: number): any[] {
    if (countries.length === 0) return [];

    const selected: any[] = [];
    const remaining = [...countries];

    // Prendre le premier pays au hasard
    const firstIndex = Math.floor(Math.random() * remaining.length);
    selected.push(remaining[firstIndex]);
    remaining.splice(firstIndex, 1);

    // Pour chaque pays suivant, prendre celui qui est le plus éloigné de tous les déjà sélectionnés
    while (selected.length < count && remaining.length > 0) {
      let bestCandidate = null;
      let bestScore = -1;
      let bestIndex = -1;

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];

        // Calculer la distance minimale avec tous les pays déjà sélectionnés
        const minDistanceToSelected = Math.min(
          ...selected.map(selected =>
            this.getDistance(
              candidate.lat2, candidate.lon2,
              selected.lat2, selected.lon2
            )
          )
        );

        // Garder le candidat avec la plus grande distance minimale
        if (minDistanceToSelected > bestScore) {
          bestScore = minDistanceToSelected;
          bestCandidate = candidate;
          bestIndex = i;
        }
      }

      // Si on a trouvé un candidat assez éloigné, l'ajouter
      if (bestCandidate && bestScore >= minDistanceKm) {
        selected.push(bestCandidate);
        remaining.splice(bestIndex, 1);
      } else {
        // Si aucun candidat n'est assez éloigné, prendre le meilleur disponible
        if (bestCandidate) {
          selected.push(bestCandidate);
          remaining.splice(bestIndex, 1);
        } else {
          break; // Plus de candidats
        }
      }
    }

    // Ajouter les distances calculées pour l'affichage
    selected.forEach(country => {
      if (selected.length > 1) {
        // Distance moyenne avec les autres pays sélectionnés
        const distances = selected
          .filter(other => other !== country)
          .map(other => this.getDistance(
            country.lat2, country.lon2,
            other.lat2, other.lon2
          ));
        country.distance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
      }
    });

    return selected;
  }

  getDoneCountry() {
    return this.http.get<SqlCountry>(`${this.apiBaseUrl}.netlify/functions/getDoneCountries`)
  }

  getAllMyCountries() {
    return this.http.get<SqlCountry[]>(`${this.apiBaseUrl}.netlify/functions/getAll`)
  }

  postNextCountry(countryName: string) {

    return this.http.post<void>(`${this.apiBaseUrl}.netlify/functions/postNextCountry`, {countryName});
  }


}
