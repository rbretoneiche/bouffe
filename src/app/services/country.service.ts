import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {forkJoin, map} from 'rxjs';

export interface SqlCountry {
  name: string
}

@Injectable({providedIn: 'root'})
export class CountryService {
  private baseUrl = 'https://restcountries.com/v3.1';

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

  getDistantCountries(inputCountry: string, minDistanceKm = 1500, count = 3) {
    const allCountries$ = this.http.get<any[]>(`${this.baseUrl}/all?fields=name,latlng,flags`);
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
          .sort(() => Math.random() - 0.5) // shuffle

        return distantCountries.slice(0, count);
      })
    );

  }

  getDoneCountry() {
    return this.http.get<SqlCountry>('http://localhost:7000/.netlify/functions/getDoneCountries')
  }

  postNextCountry(countryName: string) {

    return this.http.post<void>('http://localhost:7000/.netlify/functions/postNextCountry', {countryName});
  }


}
