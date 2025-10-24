import { inject, Injectable } from "@angular/core";
import { Employee } from "../models/employee.model";
import { HttpClient, HttpParams } from "@angular/common/http";
import { environment } from "../../../enviroments/environment.development";
import { map, tap } from "rxjs/operators";


interface LoginResult{
    token: string;
    employee: Employee;
}

@Injectable({ providedIn: 'root' })
export class AuthService{
    private http = inject(HttpClient);
    private TOKEN = 'token';
    private EMP = 'employee'; 

    login(credentials: {username:string; password:string}){
        const params = new HttpParams()
        .set('username', credentials.username)
        .set('password', credentials.password);
    

        return this.http.get<Employee[]>(`${environment.apiBase}/employees`, { params }).pipe(
            map(list => {
            if (list.length !==1) throw new Error('invalid');
            const employee = list[0];
            const token = btoa(`${employee.username}:${Date.now()}`);
            const{password, ...safeEmployee}=employee as any;
            return {token, employee: safeEmployee} as LoginResult
        }), 
        tap(res => this.setSession(res))
        );
    }
    
    setSession(res: LoginResult) {
        sessionStorage.setItem(this.TOKEN, res.token);
        sessionStorage.setItem(this.EMP, JSON.stringify(res.employee));
    }

    getToken() { 
        return sessionStorage.getItem(this.TOKEN); 
    }

    getEmployee(): Employee | null {
        const raw = sessionStorage.getItem(this.EMP);
        return raw ? JSON.parse(raw) as Employee : null;
    }

    isLoggedIn() { 
        return !!this.getToken(); 
    }

    logout() { 
        sessionStorage.removeItem(this.TOKEN); sessionStorage.removeItem(this.EMP);
    }
}
