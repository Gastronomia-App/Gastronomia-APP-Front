import { Person } from "./person.model";
export type Role = 'ADMIN' | 'WAITER' | 'CASHIER';

export interface Employee extends Person{
    username:string;
    password?:string;
    role: Role
}